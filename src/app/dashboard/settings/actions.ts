"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updatePassword(userId: string, current: string, newPass: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { error: "Utilisateur introuvable" };
    }

    if (!user.pinHash) {
      return { error: "Vous n'avez pas de mot de passe défini" };
    }

    const isValid = await bcrypt.compare(current, user.pinHash);
    if (!isValid) {
      return { error: "Mot de passe actuel incorrect" };
    }

    const newHash = await bcrypt.hash(newPass, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: newHash }
    });

    // Log this action for security audit
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAddress: "N/A", // This could be passed from headers in a full impl
        userAgent: "N/A", // Same
        success: true,
        reason: "PASSWORD_CHANGE"
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: "Mot de passe mis à jour avec succès" };
  } catch (error) {
    console.error("Error updating password:", error);
    return { error: "Une erreur est survenue lors de la mise à jour" };
  }
}

export async function updateProfilePhoto(userId: string, photoUrl: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { photoUrl }
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile photo:", error);
    return { error: "Une erreur est survenue lors de la mise à jour de la photo" };
  }
}
