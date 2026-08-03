"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgencyRepository } from "@/repositories/agencyRepository";
import { agencySchema } from "@/lib/validations/agency";
import { actionRateLimit } from "@/lib/rateLimit";

export async function createAgencyAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Non autorisé." };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA', 'AGENT'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG/AGENT requis." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter avant de réessayer." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      ville: formData.get("ville") as string,
      adresse: formData.get("adresse") as string,
      telephone: formData.get("telephone") as string || undefined,
      responsable: formData.get("responsable") as string || undefined,
    };

    const validatedFields = agencySchema.safeParse(rawData);
    
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { nom, ville, adresse, telephone, responsable } = validatedFields.data;

    const agency = await AgencyRepository.create({
      nom,
      ville,
      adresse: adresse || null,
      telephone: telephone || null,
      responsable: responsable || null,
    }, user.userId);

    revalidatePath("/dashboard/agencies");
    return { success: true, data: agency };
  } catch (error: unknown) {
    console.error("Error creating agency:", error);
    return { error: "Une erreur s'est produite lors de la création de l'agence." };
  }
}

export async function getAgencies() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Non autorisé. Authentification requise." };
    }

    const agencies = await AgencyRepository.findAll();
    return { success: true, data: agencies };
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return { error: "Impossible de récupérer les agences." };
  }
}

export async function getPotentialManagers() {
  try {
    const users = await prisma.user.findMany({
      where: { 
        isActive: true,
        role: { in: ['CHEF_AGENCE', 'AGENT'] }
      },
      select: { id: true, nom: true, prenom: true, role: true }
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: "Erreur serveur" };
  }
}

export async function toggleAgencyStatusAction(id: string, currentStatus: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA', 'AGENT'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG/AGENT requis." };
    }

    await AgencyRepository.update(id, { isActive: !currentStatus }, user.userId);
    revalidatePath("/dashboard/agencies");
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling agency status:", error);
    return { error: "Erreur lors de la modification du statut." };
  }
}

export async function updateAgencyAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA', 'AGENT'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG/AGENT requis." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      ville: formData.get("ville") as string,
      adresse: formData.get("adresse") as string,
      telephone: formData.get("telephone") as string || undefined,
      responsable: formData.get("responsable") as string || undefined,
    };

    const validatedFields = agencySchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { nom, ville, adresse, telephone, responsable } = validatedFields.data;

    const agency = await AgencyRepository.update(id, {
      nom,
      ville,
      adresse: adresse || null,
      telephone: telephone || null,
      responsable: responsable || null,
    }, user.userId);

    revalidatePath("/dashboard/agencies");
    return { success: true, data: agency };
  } catch (error) {
    console.error("Error updating agency:", error);
    return { error: "Une erreur s'est produite lors de la modification de l'agence." };
  }
}

export async function deleteAgencyAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA', 'AGENT'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG/AGENT requis." };
    }

    // Check relations first (Operations, Users)
    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, operations: true }
        }
      }
    });

    if (!agency) return { error: "Agence introuvable." };
    if (agency._count.users > 0 || agency._count.operations > 0) {
      return { error: "Impossible de supprimer cette agence car elle contient des utilisateurs ou des opérations. Veuillez la suspendre à la place." };
    }

    await AgencyRepository.delete(id, user.userId);
    revalidatePath("/dashboard/agencies");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting agency:", error);
    return { error: "Erreur lors de la suppression." };
  }
}
