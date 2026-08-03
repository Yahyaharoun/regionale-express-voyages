"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface DashboardStats {
  pendingCount: number;
  pendingAmount: number;
  draftCount: number;
  rejectedCount: number;
}

export async function getDashboardStats(agencyId: string): Promise<DashboardStats> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé. Session requise.");

  if (user.role !== 'PDG' && user.role !== 'DG') {
    if (user.agencyId && user.agencyId !== agencyId) {
      throw new Error("Accès refusé. Vous ne pouvez pas consulter les statistiques d'une autre agence (IDOR bloqué).");
    }
  }

  const grouped = await prisma.operation.groupBy({
    by: ['statut'],
    where: { agencyId },
    _count: { _all: true },
    _sum: { montant: true },
  });

  const stats: DashboardStats = {
    pendingCount: 0,
    pendingAmount: 0,
    draftCount: 0,
    rejectedCount: 0,
  };

  for (const group of grouped) {
    if (group.statut === 'EN_ATTENTE') {
      stats.pendingCount = group._count._all;
      stats.pendingAmount = group._sum.montant ?? 0;
    } else if (group.statut === 'BROUILLON') {
      stats.draftCount = group._count._all;
    } else if (group.statut === 'REJETEE') {
      stats.rejectedCount = group._count._all;
    }
  }

  return stats;
}

export interface PDGStats {
  revenueDay: number;
  revenueMonth: number;
  expenseDay: number;
  expenseMonth: number;
  totalDeposits: number;
  theoreticalBalance: number;
  totalVoyages: number;
  totalColis: number;
  bankObjective: number;
  objectiveProgress: number;
  recetteDay: number;
  recetteMonth: number;
  totalRecettes: number;
  validationsCount: number;
  rejetsCount: number;
  brouillonsCount: number;
  enAttenteCount: number;
}

export async function getPDGDashboardStats(period: string = "MONTH", bankId?: string, fromDate?: string, toDate?: string, agencyId?: string): Promise<PDGStats> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé. Session requise.");

  if (user.role !== 'PDG' && user.role !== 'DG') {
    if (user.agencyId && user.agencyId !== agencyId) {
      throw new Error("Accès refusé aux données de cette agence (IDOR bloqué).");
    }
    // If agent tries to see PDG stats without agencyId filter, force their agencyId
    if (!agencyId && user.agencyId) {
      agencyId = user.agencyId;
    }
  } else {
    // VULN-008: Audit Log pour la lecture du rapport global par la direction
    // (Uniquement si le filtre d'agence n'est pas appliqué à une seule agence)
    if (!agencyId || agencyId === 'ALL') {
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          role: user.role,
          action: 'VIEW_GLOBAL_REPORT',
          tableName: 'Dashboard',
          recordId: period,
        }
      });
    }
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let startDate = new Date(0); // ALL
  let endDate = new Date(now.getFullYear() + 10, 0, 1); // Far future

  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    if (period === 'JOUR') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'HIER') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (period === 'SEMAINE') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
    } else if (period === 'MOIS') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'ANNEE') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  }

  const whereClause: any = { 
    statut: { in: ['VALIDEE', 'VALIDEE_DG'] }, 
    dateOperation: { gte: startDate, lte: endDate } 
  };
  
  if (bankId && bankId !== 'ALL') {
    whereClause.OR = [
      { bankId: bankId },
      { type: { in: ['DEPENSE', 'RECETTE', 'PAIEMENT_FOURNISSEUR'] } }
    ];
  }
  
  if (agencyId) {
    whereClause.agencyId = agencyId;
  }

  const allValidOperations = await prisma.operation.findMany({
    where: whereClause,
    select: { type: true, montant: true, dateOperation: true }
  });

  let expenseDay = 0, expenseMonth = 0;
  let revenueDay = 0, revenueMonth = 0;
  let recetteDay = 0, recetteMonth = 0;
  let totalRecettes = 0;
  let totalDeposits = 0;

  for (const op of allValidOperations) {
    if (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') {
      if (op.dateOperation >= startOfDay) expenseDay += op.montant;
      expenseMonth += op.montant; // since it's already filtered by period
    } else if (op.type === 'VERSEMENT') {
      if (op.dateOperation >= startOfDay) revenueDay += op.montant;
      revenueMonth += op.montant; // since it's already filtered by period
      totalDeposits += op.montant;
    } else if (op.type === 'RECETTE') {
      if (op.dateOperation >= startOfDay) recetteDay += op.montant;
      recetteMonth += op.montant;
      totalRecettes += op.montant;
    }
  }

  const allExpenses = allValidOperations.filter(op => op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR').reduce((acc, curr) => acc + curr.montant, 0);
  const theoreticalBalance = totalDeposits - allExpenses;

  let objWhereClause: any = {
    dateDebut: { lte: endDate },
    dateFin: { gte: startDate }
  };
  if (bankId && bankId !== 'ALL') {
    objWhereClause.bankId = bankId;
  }

  const currentObjectives = await prisma.bankObjective.findMany({
    where: objWhereClause
  });
  
  const bankObjective = currentObjectives.reduce((acc, obj) => acc + obj.montant, 0);
  const objectiveProgress = bankObjective > 0 ? (totalDeposits / bankObjective) * 100 : 0;

  const groupedStatus = await prisma.operation.groupBy({
    by: ['statut'],
    where: { 
      dateOperation: { gte: startDate, lte: endDate },
      ...(bankId && bankId !== 'ALL' ? { bankId } : {}),
      ...(agencyId ? { agencyId } : {})
    },
    _count: { _all: true }
  });

  let validationsCount = 0, rejetsCount = 0, brouillonsCount = 0, enAttenteCount = 0;
  for (const group of groupedStatus) {
    if (group.statut === 'VALIDEE') validationsCount = group._count._all;
    if (group.statut === 'REJETEE') rejetsCount = group._count._all;
    if (group.statut === 'BROUILLON') brouillonsCount = group._count._all;
    if (group.statut === 'EN_ATTENTE' || group.statut === 'VALIDEE_DG') enAttenteCount += group._count._all;
  }

  return {
    revenueDay,
    revenueMonth,
    expenseDay,
    expenseMonth,
    totalDeposits,
    theoreticalBalance,
    totalVoyages: 0, 
    totalColis: 0,   
    bankObjective,
    objectiveProgress: Math.min(objectiveProgress, 100),
    recetteDay,
    recetteMonth,
    totalRecettes,
    validationsCount,
    rejetsCount,
    brouillonsCount,
    enAttenteCount
  };
}

export async function getChartData(period: string = "MONTH", bankId?: string, fromDate?: string, toDate?: string, agencyId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé. Session requise.");

  if (user.role !== 'PDG' && user.role !== 'DG') {
    if (user.agencyId && user.agencyId !== agencyId) {
      throw new Error("Accès refusé aux données de cette agence (IDOR bloqué).");
    }
    if (!agencyId && user.agencyId) {
      agencyId = user.agencyId;
    }
  }

  const now = new Date();
  
  let startDate = new Date(0);
  let endDate = new Date(now.getFullYear() + 10, 0, 1);

  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    if (period === 'DAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'WEEK') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
    } else if (period === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  }

  const whereClause: any = { 
    statut: { in: ['VALIDEE', 'VALIDEE_DG'] }, 
    dateOperation: { gte: startDate, lte: endDate } 
  };
  
  if (bankId && bankId !== 'ALL') {
    whereClause.OR = [
      { bankId: bankId },
      { type: { in: ['DEPENSE', 'RECETTE', 'PAIEMENT_FOURNISSEUR'] } }
    ];
  }

  if (agencyId) {
    whereClause.agencyId = agencyId;
  }

  const operations = await prisma.operation.findMany({
    where: whereClause,
    select: {
      type: true,
      montant: true,
      dateOperation: true,
      bankId: true,
      category: { select: { nom: true } },
      agency: { select: { nom: true } },
      bank: { select: { nom: true } }
    }
  });

  // 1. Répartition des dépenses par catégorie
  const expensesByCategoryMap = new Map<string, number>();
  const recettesByCategoryMap = new Map<string, number>();
  const recettesByAgencyMap = new Map<string, number>();

  operations.filter(op => (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') && op.category).forEach(op => {
    const catName = op.category!.nom;
    expensesByCategoryMap.set(catName, (expensesByCategoryMap.get(catName) || 0) + op.montant);
  });
  operations.filter(op => op.type === 'RECETTE' && op.category).forEach(op => {
    const catName = op.category!.nom;
    recettesByCategoryMap.set(catName, (recettesByCategoryMap.get(catName) || 0) + op.montant);
  });
  operations.filter(op => op.type === 'RECETTE' && op.agency).forEach(op => {
    const agName = op.agency!.nom;
    recettesByAgencyMap.set(agName, (recettesByAgencyMap.get(agName) || 0) + op.montant);
  });

  const recettesByCategory = Array.from(recettesByCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([name, value]) => ({ name, value }));

  // 2. Dépenses par agence
  const expensesByAgencyMap = new Map<string, number>();
  operations.filter(op => (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') && op.agency).forEach(op => {
    const agName = op.agency!.nom;
    expensesByAgencyMap.set(agName, (expensesByAgencyMap.get(agName) || 0) + op.montant);
  });
  const expensesByAgency = Array.from(expensesByAgencyMap.entries()).map(([name, value]) => ({ name, value }));

  // 3. Versements par banque
  const depositsByBankMap = new Map<string, number>();
  operations.filter(op => op.type === 'VERSEMENT' && op.bank).forEach(op => {
    const bankName = op.bank!.nom;
    depositsByBankMap.set(bankName, (depositsByBankMap.get(bankName) || 0) + op.montant);
  });
  
  const recettesByAgency = Array.from(recettesByAgencyMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const depositsByBank = Array.from(depositsByBankMap.entries()).map(([name, value]) => ({ name, value }));

  // 4. Évolution des revenus et dépenses (Dynamique selon la période)
  const evolutionMap = new Map<string, { month: string, revenues: number, depenses: number, recettes: number, recettesL1: number, recettesL2: number }>();
  
  // Initialisation pour garantir une courbe continue
  // Initialisation pour garantir une courbe continue
  if (period === 'JOUR' || period === 'HIER') {
    for (let i = 0; i <= 23; i++) {
      const label = `${i}h`;
      evolutionMap.set(label, { month: label, revenues: 0, depenses: 0, recettes: 0, recettesL1: 0, recettesL2: 0 });
    }
  } else if (period === 'SEMAINE') {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    days.forEach(d => evolutionMap.set(d, { month: d, revenues: 0, depenses: 0, recettes: 0, recettesL1: 0, recettesL2: 0 }));
  } else if (period === 'MOIS') {
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      evolutionMap.set(i.toString(), { month: i.toString(), revenues: 0, depenses: 0, recettes: 0, recettesL1: 0, recettesL2: 0 });
    }
  } else if (period === 'ANNEE') {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    months.forEach(m => evolutionMap.set(m, { month: m, revenues: 0, depenses: 0, recettes: 0, recettesL1: 0, recettesL2: 0 }));
  }
  
  operations.forEach(op => {
    let key = '';
    if (period === 'JOUR' || period === 'HIER') {
      key = `${op.dateOperation.getHours()}h`;
    } else if (period === 'SEMAINE') {
      const dayIndex = op.dateOperation.getDay();
      // getDay() returns 0 for Sunday, 1 for Monday. We want Lun, Mar... Dim
      const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      key = days[mappedIndex];
    } else if (period === 'MOIS') {
      key = op.dateOperation.getDate().toString();
    } else if (period === 'ANNEE') {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      key = months[op.dateOperation.getMonth()];
    } else {
      key = op.dateOperation.getFullYear().toString();
    }
    
    if (!evolutionMap.has(key)) {
      evolutionMap.set(key, { month: key, revenues: 0, depenses: 0, recettes: 0, recettesL1: 0, recettesL2: 0 });
    }
    
    const entry = evolutionMap.get(key)!;
    if (op.type === 'VERSEMENT') entry.revenues += op.montant;
    if (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') entry.depenses += op.montant;
    if (op.type === 'RECETTE') {
      entry.recettes += op.montant;
      if (op.agency?.nom.toLowerCase().includes("mbalmayo") || op.agency?.nom.toLowerCase().includes("mvan")) {
        entry.recettesL1 += op.montant;
      } else if (op.agency?.nom.toLowerCase().includes("mimboman") || op.agency?.nom.toLowerCase().includes("ayos") || op.agency?.nom.toLowerCase().includes("akonolinga")) {
        entry.recettesL2 += op.montant;
      }
    }
  });

  const evolution = Array.from(evolutionMap.values());

  // 5. Évolution des Objectifs Bancaires vs Versements
  let objWhereClause: any = {
    dateDebut: { lte: endDate },
    dateFin: { gte: startDate }
  };
  if (bankId && bankId !== 'ALL') {
    objWhereClause.bankId = bankId;
  }
  const objectives = await prisma.bankObjective.findMany({ where: objWhereClause });
  
  const objMap = new Map<string, { month: string, objectif: number, versements: number }>();
  
  operations.filter(op => op.type === 'VERSEMENT').forEach(op => {
    const month = op.dateOperation.toLocaleString('fr-FR', { month: 'short' });
    const year = op.dateOperation.getFullYear();
    const key = `${month} ${year}`;
    if (!objMap.has(key)) objMap.set(key, { month: key, objectif: 0, versements: 0 });
    objMap.get(key)!.versements += op.montant;
  });

  objectives.forEach(obj => {
    const month = obj.dateDebut.toLocaleString('fr-FR', { month: 'short' });
    const year = obj.dateDebut.getFullYear();
    const key = `${month} ${year}`;
    if (!objMap.has(key)) objMap.set(key, { month: key, objectif: 0, versements: 0 });
    objMap.get(key)!.objectif += obj.montant;
  });

  const objectiveEvolution = Array.from(objMap.values()).sort((a, b) => {
    // sort simple par ordre d'insertion ou parse date (on simplifie)
    return 0;
  });

  // 6. Tableau des Objectifs Bancaires
  const banksStatsMap = new Map<string, any>();
  const banksData = await prisma.bank.findMany({
    where: { isActive: true },
    select: { id: true, nom: true }
  });

  banksData.forEach(b => {
    banksStatsMap.set(b.id, {
      nom: b.nom,
      objectif: 0,
      atteint: 0,
      restant: 0,
      pourcentage: 0,
      evolution: 0,
      statut: 'En cours'
    });
  });

  objectives.forEach(obj => {
    if (banksStatsMap.has(obj.bankId)) {
      banksStatsMap.get(obj.bankId).objectif += obj.montant;
    }
  });

  operations.filter(op => op.type === 'VERSEMENT').forEach(op => {
    if (op.bankId && banksStatsMap.has(op.bankId)) {
      banksStatsMap.get(op.bankId).atteint += op.montant;
    }
  });

  let globalObj = 0;
  let globalAtt = 0;

  const banksStats = Array.from(banksStatsMap.values()).map(bs => {
    bs.restant = Math.max(0, bs.objectif - bs.atteint);
    bs.pourcentage = bs.objectif > 0 ? (bs.atteint / bs.objectif) * 100 : 0;
    if (bs.pourcentage >= 100) bs.statut = 'Atteint';
    else if (bs.pourcentage >= 80) bs.statut = 'Bientôt Atteint';
    else if (bs.objectif === 0) bs.statut = 'Non défini';
    
    globalObj += bs.objectif;
    globalAtt += bs.atteint;
    return bs;
  });

  const globalBankStats = {
    objectif: globalObj,
    atteint: globalAtt,
    restant: Math.max(0, globalObj - globalAtt),
    pourcentage: globalObj > 0 ? (globalAtt / globalObj) * 100 : 0,
    evolution: 0 // to implement if needed
  };

  return {
    expensesByCategory,
    expensesByAgency,
    depositsByBank,
    evolution,
    objectiveEvolution,
    banksStats,
    globalBankStats
  };
}
