import { prisma } from "@/lib/prisma";

/**
 * Calcule le NET EN CAISSE global ou par agence.
 *
 * NET EN CAISSE = RECETTES validées − DÉPENSES validées − VERSEMENTS validés
 *
 * Seules les opérations au statut VALIDEE sont comptabilisées.
 * Les opérations EN_ATTENTE, BROUILLON, REJETEE, ANNULEE sont exclues.
 *
 * @param agencyId - Si fourni, calcule uniquement pour cette agence. Sinon, calcul global.
 * @param dateRange - Optionnel : filtre par plage de dates sur dateOperation
 */
export async function getNetEnCaisse(
  agencyId?: string | null,
  dateRange?: { startDate?: Date; endDate?: Date }
): Promise<{
  recettesBrutes: number;
  recettesVIP: number;
  recettesClassique: number;
  totalDepenses: number;
  totalVersements: number;
  netEnCaisse: number;
}> {
  const baseWhere: any = {
    statut: "VALIDEE",
  };

  if (agencyId) {
    baseWhere.agencyId = agencyId;
  }

  if (dateRange?.startDate || dateRange?.endDate) {
    baseWhere.dateOperation = {};
    if (dateRange.startDate) baseWhere.dateOperation.gte = dateRange.startDate;
    if (dateRange.endDate) baseWhere.dateOperation.lte = dateRange.endDate;
  }

  const [recettesAgg, recettesVIPAgg, recettesClassiqueAgg, depensesSimplesAgg, depensesFournisseurAgg, versementsAgg] = await Promise.all([
    prisma.operation.aggregate({
      where: { ...baseWhere, type: "RECETTE" },
      _sum: { montant: true },
    }),
    prisma.operation.aggregate({
      where: { ...baseWhere, type: "RECETTE", typeRecette: "VIP" },
      _sum: { montant: true },
    }),
    prisma.operation.aggregate({
      where: { ...baseWhere, type: "RECETTE", typeRecette: "CLASSIQUE" },
      _sum: { montant: true },
    }),
    prisma.operation.aggregate({
      where: {
        ...baseWhere,
        type: { in: ["DEPENSE", "PAIEMENT_FOURNISSEUR"] },
        fournisseurId: null,
      },
      _sum: { montant: true },
    }),
    prisma.operation.aggregate({
      where: {
        ...baseWhere,
        type: { in: ["DEPENSE", "PAIEMENT_FOURNISSEUR"] },
        fournisseurId: { not: null },
      },
      _sum: { montantVerse: true },
    }),
    prisma.operation.aggregate({
      where: { ...baseWhere, type: "VERSEMENT" },
      _sum: { montant: true },
    }),
  ]);

  const recettesBrutes = recettesAgg._sum.montant ?? 0;
  const recettesVIP = recettesVIPAgg._sum.montant ?? 0;
  const recettesClassique = recettesClassiqueAgg._sum.montant ?? 0;
  const totalDepenses = (depensesSimplesAgg._sum.montant ?? 0) + (depensesFournisseurAgg._sum.montantVerse ?? 0);
  const totalVersements = versementsAgg._sum.montant ?? 0;
  const netEnCaisse = recettesBrutes - totalDepenses - totalVersements;

  return {
    recettesBrutes,
    recettesVIP,
    recettesClassique,
    totalDepenses,
    totalVersements,
    netEnCaisse,
  };
}

/**
 * Vérifie si un montant peut être dépensé / versé en fonction du Net en Caisse.
 * Retourne true si l'opération est possible, false sinon.
 */
export async function canAffordOperation(
  montant: number,
  agencyId?: string | null
): Promise<{ canAfford: boolean; netEnCaisse: number; message?: string }> {
  const { netEnCaisse } = await getNetEnCaisse(agencyId);

  if (montant > netEnCaisse) {
    return {
      canAfford: false,
      netEnCaisse,
      message: `Opération impossible : le Net en Caisse disponible est insuffisant. Disponible : ${netEnCaisse.toLocaleString("fr-FR")} FCFA. Demandé : ${montant.toLocaleString("fr-FR")} FCFA.`,
    };
  }

  return { canAfford: true, netEnCaisse };
}

/**
 * Helper pour déterminer si un rôle est "Agent de saisie uniquement"
 * (ne peut pas modifier, supprimer, valider ou annuler)
 */
export function isAgentRole(role: string): boolean {
  const AGENT_ROLES = [
    "AGENT",
    "CAISSIER",
    "CHEF_AGENCE",
    "COMPTABLE",
    "SECRETAIRE",
    "AUTRE",
    "DGA",
  ];
  return AGENT_ROLES.includes(role);
}

/**
 * Helper pour déterminer si un rôle peut valider les opérations
 */
export function canValidateOperations(role: string): boolean {
  return role === "PDG" || role === "DG";
}
