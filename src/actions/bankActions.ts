"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BankRepository } from "@/repositories/bankRepository";
import { bankSchema } from "@/lib/validations/bank";
import { actionRateLimit } from "@/lib/rateLimit";

export async function createBankAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle requis." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      numeroCompte: formData.get("numeroCompte") as string,
      agenceBancaire: formData.get("agenceBancaire") as string || undefined,
      devise: formData.get("devise") as string || "XAF",
      objectifMensuel: formData.get("objectifMensuel") as string || undefined,
    };

    const validatedFields = bankSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const bank = await BankRepository.create(validatedFields.data, user.userId);

    revalidatePath("/dashboard/banks");
    return { success: true, data: bank };
  } catch (error) {
    console.error("Error creating bank:", error);
    return { error: "Une erreur s'est produite lors de la création de la banque." };
  }
}

export async function getBanks() {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const banks = await BankRepository.findAll();
    return { success: true, data: banks };
  } catch (error) {
    console.error("Error fetching banks:", error);
    return { error: "Impossible de récupérer les banques." };
  }
}

export async function toggleBankStatusAction(id: string, currentStatus: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    await BankRepository.update(id, { isActive: !currentStatus }, user.userId);
    revalidatePath("/dashboard/banks");
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling bank status:", error);
    return { error: "Erreur lors de la modification du statut." };
  }
}

export async function updateBankAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    if (!await actionRateLimit.check(user.userId)) {
      return { error: "Trop de requêtes. Veuillez patienter." };
    }

    const rawData = {
      nom: formData.get("nom") as string,
      numeroCompte: formData.get("numeroCompte") as string,
      agenceBancaire: formData.get("agenceBancaire") as string || undefined,
      devise: formData.get("devise") as string || "XAF",
      objectifMensuel: formData.get("objectifMensuel") as string || undefined,
    };

    const validatedFields = bankSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { objectifMensuel, ...bankData } = validatedFields.data;
    const bank = await BankRepository.update(id, bankData, user.userId);
    
    // update objective if present
    if (objectifMensuel) {
        const date = new Date();
        const premierJour = new Date(date.getFullYear(), date.getMonth(), 1);
        const dernierJour = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // upsert
        const existingObj = await prisma.bankObjective.findFirst({
            where: { bankId: id, dateDebut: { gte: premierJour } }
        });
        if (existingObj) {
            await prisma.bankObjective.update({
                where: { id: existingObj.id },
                data: { montant: parseInt(objectifMensuel, 10) }
            });
        } else {
            await prisma.bankObjective.create({
                data: {
                    bankId: id,
                    montant: parseInt(objectifMensuel, 10),
                    dateDebut: premierJour,
                    dateFin: dernierJour
                }
            });
        }
    }

    revalidatePath("/dashboard/banks");
    return { success: true, data: bank };
  } catch (error) {
    console.error("Error updating bank:", error);
    return { error: "Une erreur s'est produite lors de la modification." };
  }
}

export async function deleteBankAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !['PDG', 'DG', 'DGA'].includes(dbUser.role)) {
      return { error: "Permission refusée. Rôle PDG/DG requis." };
    }

    const bank = await prisma.bank.findUnique({
      where: { id },
      include: {
        _count: {
          select: { versements: true }
        }
      }
    });

    if (!bank) return { error: "Banque introuvable." };
    if (bank._count.versements > 0) {
      return { error: "Impossible de supprimer cette banque car elle contient des versements liés." };
    }

    await BankRepository.delete(id, user.userId);
    revalidatePath("/dashboard/banks");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting bank:", error);
    return { error: "Erreur lors de la suppression." };
  }
}
