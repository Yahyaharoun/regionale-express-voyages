"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { OperationRepository } from "@/repositories/operationRepository";
import { getCurrentUser } from "@/lib/auth";
import { actionRateLimit } from "@/lib/rateLimit";
import { sendPushNotification } from "@/lib/firebase/fcm";
import { notifyRolesOnOperationAction } from "@/lib/notificationHelper";

export async function bulkValidateOperationsAction(ids: string[], statut: "VALIDEE" | "REJETEE") {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || (dbUser.role !== 'DG' && dbUser.role !== 'PDG')) {
      return { error: "Permission refusée. Seul le DG ou le PDG peut valider une opération." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter avant de réessayer." };
    }

    const previousOps = await OperationRepository.bulkUpdateStatus(ids, statut, user.userId, dbUser.role);

    // Notifications
    if (statut === 'VALIDEE') {
      await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, 'VALIDATED', { type: "Opération", count: ids.length }, "/dashboard");
    } else {
      await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, 'REJECTED', { type: "Opération", count: ids.length }, "/dashboard");
    }

    // @ts-ignore
    revalidateTag('operations');
    revalidatePath("/dashboard/expenses", "page");
    revalidatePath("/dashboard/deposits", "page");
    revalidatePath("/dashboard/fournisseurs", "page");
    revalidatePath("/dashboard/recettes", "page");
    revalidatePath("/dashboard", "layout");

    return { success: true, count: previousOps.length };
  } catch (error: any) {
    console.error("Bulk Validate Error:", error);
    return { error: error.message || "Impossible de valider en masse." };
  }
}

export async function bulkDeleteOperationsAction(ids: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur non trouvé." };

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes." };
    }

    const result = await OperationRepository.bulkDelete(ids, dbUser.id, dbUser.role);

    await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, 'DELETED', { type: "Opération", count: ids.length }, "/dashboard");

    // @ts-ignore
    revalidateTag('operations');
    revalidatePath("/dashboard/expenses", "page");
    revalidatePath("/dashboard/deposits", "page");
    revalidatePath("/dashboard/fournisseurs", "page");
    revalidatePath("/dashboard", "layout");

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return { error: error.message || "Impossible de supprimer en masse." };
  }
}

export async function bulkCancelOperationsAction(ids: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur non trouvé." };

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes." };
    }

    const result = await OperationRepository.bulkCancel(ids, dbUser.id, dbUser.role);

    await notifyRolesOnOperationAction(dbUser.role, `${dbUser.prenom} ${dbUser.nom}`, 'CANCELLED', { type: "Opération", count: ids.length }, "/dashboard");

    // @ts-ignore
    revalidateTag('operations');
    revalidatePath("/dashboard/expenses", "page");
    revalidatePath("/dashboard/deposits", "page");
    revalidatePath("/dashboard/fournisseurs", "page");
    revalidatePath("/dashboard", "layout");

    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Bulk Cancel Error:", error);
    return { error: error.message || "Impossible d'annuler en masse." };
  }
}
