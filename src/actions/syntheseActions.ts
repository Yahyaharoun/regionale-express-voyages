"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getSyntheseLignesData(period: string = "DAY", fromDate?: string, toDate?: string) {
  const user = await getCurrentUser();
  // Accessible à tous les utilisateurs authentifiés (AGENT inclus = lecture seule)
  if (!user) {
    return { error: "Non autorisé." };
  }

  const now = new Date();
  let startDate = new Date(0);
  let endDate = new Date(now.getFullYear() + 10, 0, 1);

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

  const operations = await prisma.operation.findMany({
    where: {
      statut: { in: ['VALIDEE', 'VALIDEE_DG'] },
      type: { in: ['RECETTE', 'DEPENSE', 'PAIEMENT_FOURNISSEUR'] },
      dateOperation: { gte: startDate, lte: endDate }
    },
    include: { agency: true },
    orderBy: { dateOperation: 'asc' }
  });

  const agencies = await prisma.agency.findMany({ where: { isActive: true } });
  
  // Group logic
  const l1Names = ["Mbalmayo", "Mvan"];
  const l2Names = ["Mimboman", "Ayos", "Akonolinga"];

  const getLigne = (nom: string) => {
    const nameLower = nom.toLowerCase();
    if (l1Names.some(n => nameLower.includes(n.toLowerCase()))) return 1;
    if (l2Names.some(n => nameLower.includes(n.toLowerCase()))) return 2;
    return 3;
  };

  // Calculate previous period dates for trend indicators
  const duration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - duration - 1);
  const prevEndDate = new Date(startDate.getTime() - 1);

  const prevOperations = await prisma.operation.findMany({
    where: {
      statut: { in: ['VALIDEE', 'VALIDEE_DG'] },
      type: { in: ['RECETTE', 'DEPENSE', 'PAIEMENT_FOURNISSEUR'] },
      dateOperation: { gte: prevStartDate, lte: prevEndDate }
    },
    include: { agency: true }
  });

  let prevRecettes = 0;
  let prevDepenses = 0;
  prevOperations.forEach(op => {
    if (op.type === 'RECETTE') prevRecettes += op.montant;
    else if (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') prevDepenses += op.montant;
  });
  const prevNetGlobal = prevRecettes - prevDepenses;

  const results = {
    ligne1: { recettes: 0, depenses: 0, agencies: [] as any[] },
    ligne2: { recettes: 0, depenses: 0, agencies: [] as any[] },
    global: { recettes: 0, depenses: 0, prevNetGlobal },
    evolution: [] as any[], // For Recharts
    agencyDistribution: [] as any[]
  };

  const agenciesMap = new Map();
  agencies.forEach(a => {
    agenciesMap.set(a.id, { id: a.id, nom: a.nom, recettes: 0, ligne: getLigne(a.nom) });
  });

  const evolutionMap = new Map<string, any>();

  // Build the skeleton for the evolution chart based on period
  if (period === 'SEMAINE') {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    days.forEach(d => evolutionMap.set(d, { name: d, recettesL1: 0, recettesL2: 0, depenses: 0, netGlobal: 0 }));
  } else if (period === 'MOIS') {
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      evolutionMap.set(i.toString(), { name: i.toString(), recettesL1: 0, recettesL2: 0, depenses: 0, netGlobal: 0 });
    }
  } else if (period === 'ANNEE') {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    months.forEach(m => evolutionMap.set(m, { name: m, recettesL1: 0, recettesL2: 0, depenses: 0, netGlobal: 0 }));
  } else {
    // JOUR or HIER
    for (let i = 0; i <= 23; i++) {
      evolutionMap.set(`${i}h`, { name: `${i}h`, recettesL1: 0, recettesL2: 0, depenses: 0, netGlobal: 0 });
    }
  }

  operations.forEach(op => {
    if (!op.agencyId || !agenciesMap.has(op.agencyId)) return;
    const ag = agenciesMap.get(op.agencyId);
    
    // Process Global Totals
    if (op.type === 'RECETTE') {
      ag.recettes += op.montant;
      if (ag.ligne === 1) results.ligne1.recettes += op.montant;
      else if (ag.ligne === 2) results.ligne2.recettes += op.montant;
      results.global.recettes += op.montant;
    } else if (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') {
      if (ag.ligne === 1) results.ligne1.depenses += op.montant;
      else if (ag.ligne === 2) results.ligne2.depenses += op.montant;
      results.global.depenses += op.montant;
    }

    // Process Evolution Data
    let key = '';
    if (period === 'SEMAINE') {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      key = days[op.dateOperation.getDay()];
    } else if (period === 'MOIS') {
      key = op.dateOperation.getDate().toString();
    } else if (period === 'ANNEE') {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      key = months[op.dateOperation.getMonth()];
    } else {
      key = `${op.dateOperation.getHours()}h`;
    }

    if (evolutionMap.has(key)) {
      const entry = evolutionMap.get(key);
      if (op.type === 'RECETTE') {
        if (ag.ligne === 1) entry.recettesL1 += op.montant;
        else if (ag.ligne === 2) entry.recettesL2 += op.montant;
      } else if (op.type === 'DEPENSE' || op.type === 'PAIEMENT_FOURNISSEUR') {
        entry.depenses += op.montant;
      }
      entry.netGlobal = (entry.recettesL1 + entry.recettesL2) - entry.depenses;
    }
  });

  results.ligne1.agencies = Array.from(agenciesMap.values()).filter(a => a.ligne === 1);
  results.ligne2.agencies = Array.from(agenciesMap.values()).filter(a => a.ligne === 2);
  results.evolution = Array.from(evolutionMap.values());
  results.agencyDistribution = Array.from(agenciesMap.values())
    .filter(a => a.recettes > 0)
    .map(a => ({ name: a.nom, value: a.recettes }));

  return { success: true, data: results };
}
