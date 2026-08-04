'use server'

import { PrismaClient, Role as PrismaRoleEnum } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { sendPushNotification } from '@/lib/firebase/fcm';

const prisma = new PrismaClient();

export async function createUser(data: any) {
  try {
    // PDG only
    const session = await getCurrentUser();
    if (!session) return { success: false, error: 'Non autorisé.' };
    const caller = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!caller || caller.role !== 'PDG') return { success: false, error: 'Permission refusée. Seul le PDG peut gérer les utilisateurs.' };
    const { nom, prenom, email, role, pin } = data;
    
    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);
    
    // Get Role ID
    const appRole = await prisma.appRole.findUnique({ where: { name: role } });

    // Ensure there is only one PDG
    if (role === 'PDG') {
      const pdgCount = await prisma.user.count({ where: { role: 'PDG' } });
      if (pdgCount >= 1) {
        return { success: false, error: 'Il ne peut y avoir qu\'un seul PDG dans le système.' };
      }
    }
    
    await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        role: role as PrismaRoleEnum,
        roleId: appRole?.id,
        pinHash,
        isActive: true,
      }
    });

    await sendPushNotification({
      title: "Nouvel utilisateur créé",
      body: `${prenom} ${nom} a été ajouté en tant que ${role} par le PDG.`,
      eventType: "USER_CREATED",
      url: "/dashboard/settings/users"
    }, ["PDG"]);


    revalidatePath('/dashboard/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Cet email est déjà utilisé par un autre utilisateur.' };
    }
    return { success: false, error: error.message || 'Erreur lors de la création.' };
  }
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: 'Non autorisé.' };
    const caller = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!caller || caller.role !== 'PDG') return { success: false, error: 'Permission refusée. Seul le PDG peut gérer les utilisateurs.' };
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/dashboard/settings/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erreur lors de la modification.' };
  }
}

export async function updateUserAction(userId: string, data: any) {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: 'Non autorisé.' };
    const caller = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!caller) return { success: false, error: 'Non autorisé.' };
    
    const isSelf = caller.id === userId;
    const isPDG = caller.role === 'PDG';
    
    if (!isPDG && !isSelf) {
      return { success: false, error: 'Permission refusée. Seul le PDG peut gérer les autres utilisateurs.' };
    }
    
    const { nom, prenom, email, role, agencyId, telephone } = data;
    
    // Get Role ID
    let roleIdToUpdate = undefined;
    let roleToUpdate = undefined;
    let agencyIdToUpdate = undefined;
    let nomToUpdate = isPDG ? nom : undefined;
    let prenomToUpdate = isPDG ? prenom : undefined;
    let emailToUpdate = isPDG ? email : undefined;

    if (isPDG) {
      const appRole = await prisma.appRole.findUnique({ where: { name: role } });
      roleToUpdate = role as PrismaRoleEnum;
      roleIdToUpdate = appRole?.id;
      agencyIdToUpdate = agencyId || null;

      // Ensure there is only one PDG if role is changed to PDG
      const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
      if (role === 'PDG' && userToUpdate?.role !== 'PDG') {
        const pdgCount = await prisma.user.count({ where: { role: 'PDG' } });
        if (pdgCount >= 1) {
          return { success: false, error: 'Il ne peut y avoir qu\'un seul PDG dans le système.' };
        }
      }
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(isPDG && { nom: nomToUpdate, prenom: prenomToUpdate, email: emailToUpdate, role: roleToUpdate, roleId: roleIdToUpdate, agencyId: agencyIdToUpdate }),
        telephone: telephone || null,
      }
    });

    revalidatePath('/dashboard/settings/users');
    return { success: true };
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Cet email est déjà utilisé par un autre utilisateur.' };
    }
    return { success: false, error: error.message || 'Erreur lors de la modification.' };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const userWithRelations = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { operations: true, validations: true }
        }
      }
    });
    
    if (!userWithRelations) return { success: false, error: "Utilisateur introuvable." };
    
    // Check if it's the only PDG
    if (userWithRelations.role === 'PDG') {
      const pdgCount = await prisma.user.count({ where: { role: 'PDG' } });
      if (pdgCount <= 1) {
        return { success: false, error: "Impossible de supprimer le dernier PDG." };
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/dashboard/settings/users');
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'Erreur lors de la suppression.' };
  }
}
