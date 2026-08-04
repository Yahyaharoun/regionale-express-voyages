"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

function parseDateRobust(dateStr: string) {
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (year > 2000 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    }
  }
  return new Date(dateStr);
}
import { OperationRepository } from "@/repositories/operationRepository";
import { writeFileSync } from "fs";
import path from "path";
import { processUpload } from "@/lib/upload";

import { expenseSchema } from "@/lib/validations/expense";
import { depositSchema } from "@/lib/validations/deposit";
import { recetteSchema } from "@/lib/validations/recette";
import { getCurrentUser } from "@/lib/auth";
import { actionRateLimit } from "@/lib/rateLimit";
import { sendPushNotification } from "@/lib/firebase/fcm";
import { canAffordOperation, isAgentRole } from "@/lib/netEnCaisse";

export async function createExpenseAction(formData: FormData) {
  try {
    // 1. Validation de l'authentification côté SERVEUR (Anti-IDOR)
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: "Non autorisé (IDOR bloqué)." };
    }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return { error: "Utilisateur introuvable." };
    }
    
    // Seuls PDG, DG, et les rôles de saisie peuvent créer une dépense
    const allowedCreateRoles = ['PDG', 'DG', 'AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE'];
    if (!allowedCreateRoles.includes(dbUser.role)) {
      return { error: "Permission refusée. Vous ne pouvez pas créer de dépense." };
    }
    
    const agentId = dbUser.id;
    let targetAgencyId = dbUser.agencyId;
    
    if (!targetAgencyId && (dbUser.role === 'PDG' || dbUser.role === 'DG' || dbUser.role === 'AGENT')) {
      const firstAgency = await prisma.agency.findFirst({ where: { isActive: true } });
      if (firstAgency) targetAgencyId = firstAgency.id;
    }

    if (!targetAgencyId) {
      return { error: "Non autorisé. Aucune agence n'est disponible pour lier l'opération." };
    }

    if (!await actionRateLimit.check(agentId)) {
      return { error: "Trop de requêtes. Veuillez patienter avant de réessayer." };
    }

    // 2. Validation Zod stricte des entrées utilisateurs (Anti-Injection / Anti-XSS)
    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      commentaire: formData.get("commentaire") as string,
      categoryId: formData.get("categoryId") as string,
      agencyId: targetAgencyId,
      statut: formData.get("statut") as any || "BROUILLON",
      fournisseurId: formData.get("fournisseurId") !== "none" ? (formData.get("fournisseurId") as string || undefined) : undefined,
      dateOperation: formData.get("dateOperation") as string || undefined,
      lignes: formData.get("lignes") ? JSON.parse(formData.get("lignes") as string) : undefined,
      statutPaiement: formData.get("statutPaiement") as string || undefined,
      montantVerse: formData.get("montantVerse") ? parseInt(formData.get("montantVerse") as string, 10) : undefined,
    };
    
    // We can't strict validate new fields with old schema, so we do manual checks for supplier mode
    if (rawData.fournisseurId) {
      if (!rawData.statutPaiement) return { error: "Statut de paiement requis" };
      if (rawData.montantVerse === undefined) return { error: "Montant versé requis" };
      if (rawData.montantVerse > rawData.montant) return { error: "Le montant versé ne peut excéder le total" };
    }

    const validatedFields = expenseSchema.safeParse({
      montant: rawData.montant,
      commentaire: rawData.commentaire,
      categoryId: rawData.categoryId,
      agencyId: rawData.agencyId,
      statut: rawData.statut,
      fournisseurId: rawData.fournisseurId,
      dateOperation: rawData.dateOperation,
    });
    
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { montant, commentaire, categoryId } = validatedFields.data;

    let justificatifUrls: string[] = [];
    const file = formData.get("justificatif") as File | null;
    if (file && file.size > 0) {
      try {
        const url = await processUpload(file);
        if (url) justificatifUrls.push(url);
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // 3. Protection idempotence serveur — empêche les doubles soumissions
    // Vérifie si une opération identique existe déjà dans les 15 dernières secondes
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const existingDuplicate = await prisma.operation.findFirst({
      where: {
        agentId,
        agencyId: targetAgencyId,
        type: rawData.fournisseurId ? "PAIEMENT_FOURNISSEUR" : "DEPENSE",
        montant: rawData.fournisseurId ? (rawData.montantVerse || 0) : montant,
        createdAt: { gte: fifteenSecondsAgo }
      }
    });
    if (existingDuplicate) {
      return { error: "Opération en double détectée. L'enregistrement a déjà été soumis.", duplicate: true };
    }

    // 4. Exécution avec les IDs certifiés
    const operation = await prisma.operation.create({
      data: {
        type: rawData.fournisseurId ? "PAIEMENT_FOURNISSEUR" : "DEPENSE",
        statut: rawData.statut,
        montant, // Total de l'opération
        commentaire,
        dateOperation: rawData.dateOperation ? parseDateRobust(rawData.dateOperation) : new Date(),
        justificatifs: justificatifUrls,
        category: { connect: { id: categoryId } },
        agency: { connect: { id: targetAgencyId } },
        agent: { connect: { id: agentId } },
        ...(rawData.fournisseurId && { 
          fournisseur: { connect: { id: rawData.fournisseurId } },
          statutPaiement: rawData.statutPaiement,
          montantVerse: rawData.montantVerse,
          montantRestant: montant - (rawData.montantVerse || 0),
          montantTotal: montant,
          nombreArticles: rawData.lignes ? rawData.lignes.length : 0,
          lignes: rawData.lignes ? {
            create: rawData.lignes.map((l: any) => ({
              produit: l.produit,
              prixUnitaire: Number(l.prixUnitaire),
              quantite: Number(l.quantite),
              montantLigne: Number(l.prixUnitaire) * Number(l.quantite)
            }))
          } : undefined
        })
      }
    });

    // Logging audit manual since we bypassed OperationRepository.create for nested writes
    await prisma.auditLog.create({
      data: {
        userId: agentId,
        role: dbUser.role,
        action: "CREATE",
        tableName: "Operation",
        recordId: operation.id,
        newData: JSON.parse(JSON.stringify(operation))
      }
    });

    // 5. Notifier PDG + DG quand soumis en attente
    if (rawData.statut === "EN_ATTENTE") {
      const notifyUsers = await prisma.user.findMany({
        where: { role: { in: ['DG', 'PDG'] }, isActive: true }
      });
      // Récupérer le nom de l'agence pour enrichir la notification
      const agencyForExpenseNotif = await prisma.agency.findUnique({ where: { id: targetAgencyId }, select: { nom: true } });
      const agencyNameExpense = agencyForExpenseNotif?.nom || "";
      
      if (notifyUsers.length > 0) {
        await prisma.notification.createMany({
          data: notifyUsers.map(m => ({
            userId: m.id,
            title: "Nouvelle Dépense à valider",
            message: `Dépense de ${montant.toLocaleString('fr-FR')} FCFA soumise par ${dbUser.prenom} ${dbUser.nom}${agencyNameExpense ? ` — Agence ${agencyNameExpense}` : ''} — validation requise.`,
            type: "INFO",
            operationId: operation.id
          }))
        });

        await sendPushNotification({
           title: "Nouvelle Dépense à valider",
           body: `Dépense de ${montant.toLocaleString('fr-FR')} FCFA par ${dbUser.prenom} ${dbUser.nom}${agencyNameExpense ? ` — Agence ${agencyNameExpense}` : ''}`,
           eventType: "EXPENSE_CREATED",
           url: "/dashboard/expenses"
        }, ["DG", "PDG"], undefined, targetAgencyId);
      }
    }

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true, data: operation };
  } catch (error: any) {
    console.error("Action error:", error);
    return { error: `Erreur interne: ${error?.message || error}` };
  }
}

export async function createDepositAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: "Non autorisé (IDOR bloqué)." };
    }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return { error: "Utilisateur introuvable." };
    }

    const allowedCreateRoles = ['PDG', 'DG', 'AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE'];
    if (!allowedCreateRoles.includes(dbUser.role)) {
      return { error: "Permission refusée. Vous ne pouvez pas créer de versement bancaire." };
    }
    
    const agentId = dbUser.id;
    let targetAgencyId = dbUser.agencyId;
    
    if (!targetAgencyId && (dbUser.role === 'PDG' || dbUser.role === 'DG' || dbUser.role === 'AGENT')) {
      const firstAgency = await prisma.agency.findFirst({ where: { isActive: true } });
      if (firstAgency) targetAgencyId = firstAgency.id;
    }

    if (!targetAgencyId) {
      return { error: "Non autorisé. Aucune agence n'est disponible pour lier l'opération." };
    }

    if (!await actionRateLimit.check(agentId)) {
      return { error: "Trop de requêtes. Veuillez patienter avant de réessayer." };
    }

    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      reference: formData.get("reference") as string,
      bankId: formData.get("bankId") as string,
      commentaire: (formData.get("commentaire") as string) || undefined,
      agencyId: targetAgencyId,
      statut: formData.get("statut") as any || "BROUILLON",
    };
    
    const validatedFields = depositSchema.safeParse(rawData);
    
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { montant, reference, bankId } = validatedFields.data;

    let justificatifUrls: string[] = [];
    const file = formData.get("justificatif") as File | null;
    if (file && file.size > 0) {
      try {
        const url = await processUpload(file);
        if (url) justificatifUrls.push(url);
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Protection idempotence serveur — empêche les doubles versements
    const fifteenSecondsAgoDeposit = new Date(Date.now() - 15000);
    const existingDepositDuplicate = await prisma.operation.findFirst({
      where: {
        agentId,
        agencyId: targetAgencyId,
        type: "VERSEMENT",
        montant: rawData.montant,
        bankId: rawData.bankId,
        createdAt: { gte: fifteenSecondsAgoDeposit }
      }
    });
    if (existingDepositDuplicate) {
      return { error: "Versement en double détecté. L'enregistrement a déjà été soumis.", duplicate: true };
    }

    const operation = await OperationRepository.create({
      type: "VERSEMENT",
      statut: rawData.statut,
      montant,
      reference,
      commentaire: rawData.commentaire,
      justificatifs: justificatifUrls,
      bank: { connect: { id: bankId } },
      agency: { connect: { id: targetAgencyId } },
      agent: { connect: { id: agentId } },
    }, agentId, dbUser.role, targetAgencyId);

    // Notifier PDG + DG quand soumis en attente
    if (rawData.statut === "EN_ATTENTE") {
      const notifyUsers = await prisma.user.findMany({
        where: { role: { in: ['DG', 'PDG'] }, isActive: true }
      });
      // Récupérer le nom de l'agence pour enrichir la notification
      const agencyForNotif = await prisma.agency.findUnique({ where: { id: targetAgencyId }, select: { nom: true } });
      const agencyName = agencyForNotif?.nom || "";
      
      if (notifyUsers.length > 0) {
        await prisma.notification.createMany({
          data: notifyUsers.map(m => ({
            userId: m.id,
            title: "Nouveau Versement bancaire à valider",
            message: `Versement bancaire de ${montant.toLocaleString('fr-FR')} FCFA soumis par ${dbUser.prenom} ${dbUser.nom}${agencyName ? ` — Agence ${agencyName}` : ''} — validation requise.`,
            type: "INFO",
            operationId: operation.id
          }))
        });

        await sendPushNotification({
           title: "Nouveau Versement bancaire à valider",
           body: `Versement de ${montant.toLocaleString('fr-FR')} FCFA par ${dbUser.prenom} ${dbUser.nom}${agencyName ? ` — Agence ${agencyName}` : ''}`,
           eventType: "DEPOSIT_CREATED",
           url: "/dashboard/deposits"
        }, ["DG", "PDG"], undefined, targetAgencyId);
      }
    }

    revalidatePath("/dashboard/deposits");
    revalidatePath("/dashboard");
    return { success: true, data: operation };
  } catch (error: unknown) {
    console.error("Error creating deposit:", error);
    return { error: "Une erreur s'est produite lors de la création du versement bancaire." };
  }
}

export async function getOperations(skip: number = 0, take: number = 50, range?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé" };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur non trouvé" };
    
    let targetAgencyId = dbUser.agencyId || 'ALL';
    
    if (targetAgencyId === 'ALL' && dbUser.role !== 'PDG' && dbUser.role !== 'DG' && dbUser.role !== 'DGA') {
      const firstAgency = await prisma.agency.findFirst({ where: { isActive: true } });
      if (firstAgency) targetAgencyId = firstAgency.id;
    }
    
    if (!targetAgencyId) return { error: "Agence non trouvée" };

    const operations = await OperationRepository.findAll(targetAgencyId, skip, take, range);
    return { success: true, data: operations };
  } catch (error) {
    console.error("Error fetching operations:", error);
    return { error: "Impossible de récupérer les opérations." };
  }
}

export async function validateOperationAction(id: string, statut: "VALIDEE" | "REJETEE") {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Non autorisé." };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || (dbUser.role !== 'DG' && dbUser.role !== 'PDG')) {
      return { error: "Permission refusée. Seul le DG ou le PDG peut valider une opération." };
    }

    const opData = await prisma.operation.findUnique({ where: { id }, select: { agencyId: true, type: true } });
    if (!opData) return { error: "Opération introuvable." };

    // PDG ou DG : validation directe en VALIDEE (pas de double workflow)
    const finalStatut: "VALIDEE" | "REJETEE" = statut;

    const validateurId = user.userId;

    if (!await actionRateLimit.check(validateurId)) {
      return { error: "Trop de requêtes. Veuillez patienter avant de réessayer." };
    }

    const operation = await OperationRepository.updateStatus(id, finalStatut, validateurId, dbUser.role);

    // Notifier l'agent et les autres lors de la validation / rejet
    if (finalStatut === 'VALIDEE') {
      const pdgUsers = await prisma.user.findMany({
        where: { role: 'PDG', isActive: true },
      });
      const op = await prisma.operation.findUnique({
        where: { id },
        select: { montant: true, type: true, reference: true, commentaire: true, agentId: true, bankId: true }
      });
      if (pdgUsers.length > 0 && op) {
        const typeLabel = op.type === 'VERSEMENT' ? 'Versement' : (op.type === 'RECETTE' ? 'Recette' : 'Dépense');
        await prisma.notification.createMany({
          data: pdgUsers.map(p => ({
            userId: p.id,
            title: `${typeLabel} validé(e) par ${dbUser.prenom} ${dbUser.nom}`,
            message: `${typeLabel} de ${op.montant.toLocaleString('fr-FR')} FCFA validé(e). ${op.reference || op.commentaire || ''}`,
            type: 'SUCCESS',
            operationId: id,
          })),
        });

        await sendPushNotification({
           title: `${typeLabel} validé(e)`,
           body: `Par ${dbUser.prenom} ${dbUser.nom}. Montant: ${op.montant.toLocaleString('fr-FR')} FCFA`,
           eventType: "OPERATION_VALIDATED_PDG",
           url: "/dashboard"
        }, ["PDG"]);

        if (op.agentId) {
          await sendPushNotification({
             title: `Votre ${typeLabel.toLowerCase()} a été validé(e)`,
             body: `Montant : ${op.montant.toLocaleString('fr-FR')} FCFA`,
             eventType: "OPERATION_VALIDATED_AGENT",
             url: op.type === 'VERSEMENT' ? "/dashboard/deposits" : (op.type === 'RECETTE' ? "/dashboard/recettes" : "/dashboard/expenses")
          }, [], op.agentId);
        }

        // Vérification des objectifs bancaires pour les versements
        if (op.type === 'VERSEMENT' && op.bankId) {
          const bank = await prisma.bank.findUnique({ where: { id: op.bankId }, include: { objectifs: true } });
          if (bank && bank.objectifs.length > 0) {
            const now = new Date();
            const currentObj = bank.objectifs.find(o => now >= o.dateDebut && now <= o.dateFin);
            if (currentObj) {
              const totalVersements = await prisma.operation.aggregate({
                where: { bankId: op.bankId, type: 'VERSEMENT', statut: 'VALIDEE', createdAt: { gte: currentObj.dateDebut, lte: currentObj.dateFin } },
                _sum: { montant: true }
              });
              const total = totalVersements._sum.montant || 0;
              const pourcentage = (total / currentObj.montant) * 100;
              
              // Seuil atteint ?
              if (pourcentage >= 100 && (total - op.montant) < currentObj.montant) {
                await sendPushNotification({
                  title: `Objectif atteint ! 🎉`,
                  body: `L'objectif de la banque ${bank.nom} est atteint à 100%.`,
                  eventType: "OBJECTIVE_REACHED",
                  url: "/dashboard"
                }, ["PDG", "DG"]);
              } else if (pourcentage >= 80 && pourcentage < 100 && ((total - op.montant) / currentObj.montant) * 100 < 80) {
                await sendPushNotification({
                  title: `Objectif bientôt atteint`,
                  body: `L'objectif de la banque ${bank.nom} est atteint à ${Math.floor(pourcentage)}%.`,
                  eventType: "OBJECTIVE_ALMOST_REACHED",
                  url: "/dashboard"
                }, ["PDG", "DG"]);
              }
            }
          }
        }
      }
    }

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/deposits");
    revalidatePath("/dashboard/recettes");
    revalidatePath("/dashboard/synthese-lignes");
    revalidatePath("/dashboard");
    return { success: true, data: operation };
  } catch (error: any) {
    console.error("Error validating operation:", error);
    require('fs').appendFileSync('validation_error.log', error.stack || error.toString() + '\n');
    return { error: "Une erreur s'est produite lors de la validation: " + (error.message || error.toString()) };
  }
}

export async function deleteOperationAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur introuvable." };

    // Les Agents de saisie ne peuvent jamais supprimer une opération
    if (isAgentRole(dbUser.role)) {
      return { error: "Permission refusée. Les agents de saisie ne peuvent pas supprimer une opération." };
    }

    const opToNotify = await prisma.operation.findUnique({ where: { id }, select: { montant: true, type: true, reference: true, commentaire: true, agencyId: true } });

    await OperationRepository.delete(id, dbUser.id, dbUser.role);

    if (opToNotify) {
      const typeLabel = opToNotify.type === 'VERSEMENT' ? 'Versement' : (opToNotify.type === 'RECETTE' ? 'Recette' : 'Dépense');
      await sendPushNotification({
         title: `${typeLabel} supprimé(e)`,
         body: `${typeLabel} de ${opToNotify.montant.toLocaleString('fr-FR')} FCFA supprimé(e) par ${dbUser.prenom} ${dbUser.nom}`,
         eventType: "OPERATION_DELETED",
         url: "/dashboard"
      }, ["DG", "PDG"], undefined, opToNotify.agencyId);
    }
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/deposits");
    revalidatePath("/dashboard/recettes");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting operation:", error);
    return { error: error.message || "Une erreur s'est produite." };
  }
}

export async function cancelOperationAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur introuvable." };

    // Les Agents de saisie ne peuvent jamais annuler une opération
    if (isAgentRole(dbUser.role)) {
      return { error: "Permission refusée. Les agents de saisie ne peuvent pas annuler une opération." };
    }

    const opToNotify = await prisma.operation.findUnique({ where: { id }, select: { montant: true, type: true, reference: true, commentaire: true, agencyId: true } });

    await OperationRepository.cancel(id, dbUser.id, dbUser.role);

    if (opToNotify) {
      const typeLabel = opToNotify.type === 'VERSEMENT' ? 'Versement' : (opToNotify.type === 'RECETTE' ? 'Recette' : 'Dépense');
      await sendPushNotification({
         title: `${typeLabel} annulé(e)`,
         body: `${typeLabel} de ${opToNotify.montant.toLocaleString('fr-FR')} FCFA annulé(e) par ${dbUser.prenom} ${dbUser.nom}`,
         eventType: "OPERATION_CANCELLED",
         url: "/dashboard"
      }, ["DG", "PDG"], undefined, opToNotify.agencyId);
    }
    
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/deposits");
    revalidatePath("/dashboard/recettes");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling operation:", error);
    return { error: error.message || "Une erreur s'est produite." };
  }
}

export async function updateExpenseAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur introuvable." };

    // Les Agents de saisie ne peuvent jamais modifier une opération existante
    if (isAgentRole(dbUser.role)) {
      return { error: "Permission refusée. Les agents de saisie ne peuvent pas modifier une opération." };
    }

    const existingOp = await prisma.operation.findUnique({ where: { id } });
    if (!existingOp) return { error: "Opération introuvable." };

    let nextStatut = "EN_ATTENTE";
    if (existingOp.statut === "VALIDEE" && (dbUser.role === 'PDG' || dbUser.role === 'DG')) {
      nextStatut = "VALIDEE"; // Le PDG/DG modifie sans repasser par la validation
    }

    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      commentaire: formData.get("commentaire") as string,
      categoryId: formData.get("categoryId") as string,
      agencyId: dbUser.agencyId || undefined,
      statut: nextStatut, 
      fournisseurId: formData.get("fournisseurId") as string || undefined,
      dateOperation: formData.get("dateOperation") as string || undefined,
    };
    
    // Quick validation
    if (!rawData.montant || !rawData.categoryId) {
      return { error: "Données invalides." };
    }

    const updateData: any = {
      montant: rawData.montant,
      commentaire: rawData.commentaire,
      category: { connect: { id: rawData.categoryId } },
      statut: rawData.statut as any
    };
    if (rawData.fournisseurId) {
      updateData.fournisseurId = rawData.fournisseurId;
      updateData.type = "PAIEMENT_FOURNISSEUR";
    }
    if (rawData.dateOperation) {
      updateData.dateOperation = parseDateRobust(rawData.dateOperation);
    }

    const operation = await OperationRepository.update(id, updateData, dbUser.id, dbUser.role);

    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return { error: "Une erreur s'est produite lors de la modification." };
  }
}

export async function updateDepositAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur introuvable." };

    // Les Agents de saisie ne peuvent jamais modifier un versement
    if (isAgentRole(dbUser.role)) {
      return { error: "Permission refusée. Les agents de saisie ne peuvent pas modifier une opération." };
    }

    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      reference: formData.get("reference") as string,
      bankId: formData.get("bankId") as string,
    };
    
    if (!rawData.montant || !rawData.bankId || !rawData.reference) {
      return { error: "Données invalides." };
    }

    const existingOp = await prisma.operation.findUnique({ where: { id } });
    if (!existingOp) return { error: "Opération introuvable." };

    let nextStatut = "EN_ATTENTE";
    if (existingOp.statut === "VALIDEE" && (dbUser.role === 'PDG' || dbUser.role === 'DG')) {
      nextStatut = "VALIDEE";
    }

    await OperationRepository.update(id, {
      montant: rawData.montant,
      reference: rawData.reference,
      bankId: rawData.bankId,
      statut: nextStatut,
    }, dbUser.id, dbUser.role);

    revalidatePath("/dashboard/deposits");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating deposit:", error);
    return { error: "Une erreur s'est produite lors de la modification." };
  }
}


export async function createRecetteAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: "Non autorisé (IDOR bloqué)." };
    }
    
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return { error: "Utilisateur introuvable." };
    }

    const allowedCreateRoles = ['PDG', 'DG', 'AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE'];
    if (!allowedCreateRoles.includes(dbUser.role)) {
      return { error: "Permission refusée. Vous ne pouvez pas créer de recette." };
    }
    
    const agentId = dbUser.id;
    let targetAgencyId = (formData.get("agencyId") as string) || dbUser.agencyId;
    
    if (!targetAgencyId && (dbUser.role === 'PDG' || dbUser.role === 'DG' || dbUser.role === 'AGENT')) {
      const firstAgency = await prisma.agency.findFirst({ where: { isActive: true } });
      if (firstAgency) targetAgencyId = firstAgency.id;
    }

    if (!targetAgencyId) {
      return { error: "Non autorisé. Aucune agence n'est disponible pour lier l'opération." };
    }

    if (!await actionRateLimit.check(agentId)) {
      return { error: "Trop de requêtes. Veuillez patienter avant de réessayer." };
    }

    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      commentaire: formData.get("commentaire") as string,
      agencyId: targetAgencyId,
      statut: formData.get("statut") as any || "EN_ATTENTE",
      dateOperation: formData.get("dateOperation") as string || undefined,
    };
    
    const validatedFields = recetteSchema.safeParse(rawData);
    
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { montant, commentaire } = validatedFields.data;

    let justificatifUrls: string[] = [];
    const file = formData.get("justificatif") as File | null;
    if (file && file.size > 0) {
      try {
        const url = await processUpload(file);
        if (url) justificatifUrls.push(url);
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Protection idempotence serveur — empêche les doubles recettes
    const fifteenSecondsAgoRecette = new Date(Date.now() - 15000);
    const existingRecetteDuplicate = await prisma.operation.findFirst({
      where: {
        agentId,
        agencyId: targetAgencyId,
        type: "RECETTE",
        montant,
        createdAt: { gte: fifteenSecondsAgoRecette }
      }
    });
    if (existingRecetteDuplicate) {
      return { error: "Recette en double détectée. L'enregistrement a déjà été soumis.", duplicate: true };
    }

    const operation = await OperationRepository.create({
      type: "RECETTE",
      statut: rawData.statut,
      montant,
      commentaire,
      dateOperation: rawData.dateOperation ? parseDateRobust(rawData.dateOperation) : new Date(),
      justificatifs: justificatifUrls,
      agency: { connect: { id: targetAgencyId } },
      agent: { connect: { id: agentId } },
    }, agentId, dbUser.role, targetAgencyId);

    // Notify DG/PDG when recipe submitted
    if (rawData.statut === "EN_ATTENTE" || rawData.statut === "VALIDEE") {
      const notifyUsers = await prisma.user.findMany({
        where: { role: { in: ['DG', 'PDG'] }, isActive: true }
      });
      
      if (notifyUsers.length > 0) {
        await prisma.notification.createMany({
          data: notifyUsers.map(m => ({
            userId: m.id,
            title: rawData.statut === "VALIDEE" ? "Nouvelle Recette" : "Nouvelle Recette à valider",
            message: `Recette de ${montant.toLocaleString('fr-FR')} FCFA soumise par ${dbUser.prenom} ${dbUser.nom}.`,
            type: "INFO",
            operationId: operation.id
          }))
        });

        await sendPushNotification({
           title: rawData.statut === "VALIDEE" ? "Nouvelle Recette" : "Nouvelle Recette à valider",
           body: `Recette de ${montant.toLocaleString('fr-FR')} FCFA soumise par ${dbUser.prenom} ${dbUser.nom}`,
           eventType: "RECETTE_CREATED",
           url: "/dashboard/recettes"
        }, ["DG", "PDG"], undefined, targetAgencyId);
      }
    }

    revalidatePath("/dashboard/recettes");
    revalidatePath("/dashboard");
    return { success: true, data: operation };
  } catch (error: unknown) {
    console.error("Error creating recette:", error);
    return { error: "Une erreur s'est produite lors de la création de la recette." };
  }
}


export async function updateRecetteAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur non trouvé." };

    const existingOp = await prisma.operation.findUnique({ where: { id } });
    if (!existingOp) return { error: "Recette introuvable." };

    // Les Agents de saisie ne peuvent jamais modifier une recette
    if (isAgentRole(dbUser.role)) {
      return { error: "Permission refusée. Les agents de saisie ne peuvent pas modifier une opération." };
    }

    if (existingOp.agentId !== dbUser.id && dbUser.role !== 'DG' && dbUser.role !== 'PDG') {
      return { error: "Permission refusée. Vous ne pouvez modifier que vos propres recettes." };
    }

    if (existingOp.statut === "VALIDEE" && dbUser.role !== 'PDG' && dbUser.role !== 'DG') {
      return { error: "Impossible de modifier une recette déjà validée." };
    }

    let nextStatut = "EN_ATTENTE";
    if (existingOp.statut === "VALIDEE" && (dbUser.role === 'PDG' || dbUser.role === 'DG')) {
      nextStatut = "VALIDEE";
    }

    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      commentaire: formData.get("commentaire") as string,
      agencyId: (formData.get("agencyId") as string) || existingOp.agencyId,
      dateOperation: formData.get("dateOperation") as string || undefined,
    };
    
    const validatedFields = recetteSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { montant, commentaire } = validatedFields.data;

    const updateData: any = {
      montant,
      commentaire,
      agencyId: rawData.agencyId,
      statut: nextStatut,
    };
    
    if (rawData.dateOperation) {
      updateData.dateOperation = parseDateRobust(rawData.dateOperation);
    }

    const operation = await OperationRepository.update(id, updateData, dbUser.id, dbUser.role);

    revalidatePath("/dashboard/recettes");
    revalidatePath("/dashboard");
    return { success: true, data: operation };
  } catch (error) {
    console.error("Error updating recette:", error);
    return { error: "Une erreur s'est produite lors de la modification de la recette." };
  }
}
