"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDettesFournisseurs() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'PDG' && user.role !== 'DG')) {
    return { error: "Non autorisé" };
  }

  const fournisseurs = await prisma.fournisseur.findMany({
    include: {
      paiements: {
        where: {
          statut: "VALIDEE",
          type: { in: ["DEPENSE", "PAIEMENT_FOURNISSEUR"] }
        },
        orderBy: { dateOperation: 'asc' }
      }
    },
    orderBy: { nom: 'asc' }
  });

  const dettes = fournisseurs.map(f => {
    let totalAchats = 0;
    let totalPaye = 0;
    let resteAPayer = 0;
    let nombreFactures = 0;

    f.paiements.forEach(p => {
      const total = p.montantTotal || p.montant;
      const verse = p.montantVerse || 0;
      totalAchats += total;
      totalPaye += verse;
      resteAPayer += (total - verse);
      nombreFactures++;
    });

    return {
      id: f.id,
      nom: f.nom,
      telephone: f.telephone,
      ville: f.ville,
      totalAchats,
      totalPaye,
      resteAPayer,
      nombreFactures,
      operationsImpayees: f.paiements.filter(p => (p.montantTotal || p.montant) > (p.montantVerse || 0))
    };
  });

  return { success: true, data: dettes.filter(d => d.totalAchats > 0) };
}

export async function reglerDetteAction(fournisseurId: string, montant: number, observation: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'PDG' && user.role !== 'DG')) {
    return { error: "Non autorisé" };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) return { error: "Utilisateur non trouvé" };

  const unpaidOps = await prisma.operation.findMany({
    where: {
      fournisseurId,
      statut: "VALIDEE",
    },
    orderBy: { dateOperation: 'asc' }
  });

  const opsToUpdate = unpaidOps.filter(p => (p.montantTotal || p.montant) > (p.montantVerse || 0));

  let remainingToApply = montant;
  let totalDette = opsToUpdate.reduce((acc, p) => acc + ((p.montantTotal || p.montant) - (p.montantVerse || 0)), 0);

  if (montant > totalDette) {
    return { error: 'Le montant dépasse la dette totale.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const op of opsToUpdate) {
        if (remainingToApply <= 0) break;

        const opTotal = op.montantTotal || op.montant;
        const opVerse = op.montantVerse || 0;
        const opReste = opTotal - opVerse;

        let amountToApply = 0;
        if (remainingToApply >= opReste) {
          amountToApply = opReste;
        } else {
          amountToApply = remainingToApply;
        }

        const newVerse = opVerse + amountToApply;
        const newReste = opTotal - newVerse;
        const newStatutPaiement = newReste === 0 ? "PAYE" : (newVerse > 0 ? "AVANCE" : "IMPAYE");

        await tx.operation.update({
          where: { id: op.id },
          data: {
            montantVerse: newVerse,
            montantRestant: newReste,
            statutPaiement: newStatutPaiement,
          }
        });

        remainingToApply -= amountToApply;
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          role: dbUser.role,
          action: "REGLER_DETTE",
          tableName: "Fournisseur",
          recordId: fournisseurId,
          newData: JSON.parse(JSON.stringify({ montantPaye: montant, observation }))
        }
      });
    });

    revalidatePath("/dashboard/dettes-fournisseurs");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: "Erreur lors du règlement de la dette." };
  }
}
