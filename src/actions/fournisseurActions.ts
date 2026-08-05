"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actionRateLimit } from "@/lib/rateLimit";

export async function getFournisseurs() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Non autorisé. Authentification requise." };
    }

    const fournisseurs = await prisma.fournisseur.findMany({
      orderBy: { nom: 'asc' }
    });
    return { success: true, data: fournisseurs };
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return { error: "Impossible de récupérer les fournisseurs." };
  }
}

export async function createFournisseurAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      ville: formData.get("ville") as string,
      adresse: formData.get("adresse") as string,
      telephone: formData.get("telephone") as string || null,
      categorie: formData.get("categorie") as string || null,
      personneContact: formData.get("personneContact") as string || null,
    };

    if (!rawData.nom) {
      return { error: "Le nom est obligatoire." };
    }

    const fournisseur = await prisma.fournisseur.create({
      data: rawData
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        role: user.role,
        action: 'CREATE',
        tableName: 'Fournisseur',
        recordId: fournisseur.id,
        newData: JSON.parse(JSON.stringify(fournisseur)),
      }
    });

    revalidatePath("/dashboard/fournisseurs");
    return { success: true, data: fournisseur };
  } catch (error: unknown) {
    console.error("Error creating fournisseur:", error);
    return { error: "Une erreur s'est produite lors de la création du fournisseur." };
  }
}

export async function updateFournisseurAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      ville: formData.get("ville") as string,
      adresse: formData.get("adresse") as string,
      telephone: formData.get("telephone") as string || null,
      categorie: formData.get("categorie") as string || null,
      personneContact: formData.get("personneContact") as string || null,
    };

    if (!rawData.nom) {
      return { error: "Le nom est obligatoire." };
    }

    const oldFournisseur = await prisma.fournisseur.findUnique({ where: { id }});
    if (!oldFournisseur) return { error: "Fournisseur introuvable." };

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: rawData
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        role: user.role,
        action: 'UPDATE',
        tableName: 'Fournisseur',
        recordId: fournisseur.id,
        oldData: JSON.parse(JSON.stringify(oldFournisseur)),
        newData: JSON.parse(JSON.stringify(fournisseur)),
      }
    });

    revalidatePath("/dashboard/fournisseurs");
    return { success: true, data: fournisseur };
  } catch (error) {
    console.error("Error updating fournisseur:", error);
    return { error: "Une erreur s'est produite lors de la modification du fournisseur." };
  }
}

export async function toggleFournisseurStatusAction(id: string, currentStatus: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    const newStatus = currentStatus === "ACTIF" ? "INACTIF" : "ACTIF";

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: { statut: newStatus }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        role: user.role,
        action: 'TOGGLE_STATUS',
        tableName: 'Fournisseur',
        recordId: fournisseur.id,
        newData: { statut: newStatus },
      }
    });

    revalidatePath("/dashboard/fournisseurs");
    return { success: true };
  } catch (error) {
    console.error("Error toggling fournisseur status:", error);
    return { error: "Erreur lors de la modification du statut." };
  }
}

export async function deleteFournisseurAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG'].includes(dbUser.role)) {
      return { error: "Permission refusée. Seul le PDG ou le DG peut supprimer un fournisseur." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    // Check if fournisseur has associated operations
    const operationsCount = await prisma.operation.count({
      where: { fournisseurId: id }
    });

    if (operationsCount > 0) {
      return { error: `Impossible de supprimer ce fournisseur car il est lié à ${operationsCount} opération(s). Veuillez le désactiver à la place.` };
    }

    const fournisseur = await prisma.fournisseur.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        role: user.role,
        action: 'DELETE',
        tableName: 'Fournisseur',
        recordId: fournisseur.id,
        oldData: JSON.parse(JSON.stringify(fournisseur)),
      }
    });

    revalidatePath("/dashboard/fournisseurs");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fournisseur:", error);
    return { error: "Une erreur s'est produite lors de la suppression du fournisseur." };
  }
}
