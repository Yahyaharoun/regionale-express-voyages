"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { OperationRepository } from "@/repositories/operationRepository";
import { getCurrentUser } from "@/lib/auth";
import { actionRateLimit } from "@/lib/rateLimit";
import { sendPushNotification } from "@/lib/firebase/fcm";

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
      const pdgUsers = await prisma.user.findMany({
        where: { role: 'PDG', isActive: true },
      });
      if (pdgUsers.length > 0) {
        await prisma.notification.createMany({
          data: pdgUsers.map(p => ({
            userId: p.id,
            title: `${ids.length} opérations validées`,
            message: `${ids.length} opérations ont été validées en masse par ${dbUser.prenom} ${dbUser.nom}.`,
            type: 'SUCCESS',
            operationId: ids[0] // just the first one as reference
          }))
        });

        await sendPushNotification({
          title: "Opérations validées en masse",
          body: `${ids.length} opérations validées par ${dbUser.prenom}`,
          eventType: "OPERATION_VALIDATED_AGENT",
          url: "/dashboard"
        }, ["PDG"]);
      }
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
