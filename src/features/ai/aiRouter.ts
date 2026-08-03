import { prisma } from '@/lib/prisma';
import { getPDGDashboardStats } from '@/actions/dashboardActions';
import { SessionPayload } from '@/lib/auth';
import { extractDateRange, extractBank, extractAgency, DateRange } from './nlpParser';
import { getNetEnCaisse, canAffordOperation } from '@/lib/netEnCaisse';

export async function processLocalAIQuery(
  userMsg: string, 
  user: SessionPayload & { role: string; agencyId?: string | null },
  context?: { from?: string, to?: string }
) {
  const msg = userMsg.toLowerCase();
  let responseText = "Je n'ai pas bien compris votre question. Pouvez-vous reformuler ?";
  const functionsCalled: string[] = [];
  
  const dateRange = extractDateRange(userMsg, context);
  const bankQuery = extractBank(userMsg);
  const agencyQuery = extractAgency(userMsg);
  const isGlobal = (user.role === 'PDG' || user.role === 'DG');
  const agencyFilter = isGlobal ? {} : { agencyId: user.agencyId! };

  try {
    // 1. Salutations et Infos Pratiques
    if (msg.includes("bonjour") || msg.includes("salut")) {
      return { text: "Bonjour ! Je suis l'IA de REGIONALE EXPRESS VOYAGES SARL. Posez-moi des questions sur les finances, le net en caisse, les recettes, dépenses et versements, ou sur nos services (adresse, téléphone, carnet de régularité).", functionsCalled };
    }
    if (msg.includes("mbalmayo") || msg.includes("adresse") || msg.includes("horaire")) {
      return { text: "📍 **Adresse Principale :** Mbalmayo, Cameroun\n🕒 **Horaires :** Ouvert 7 jours / 7 de 04h00 à 00h00 pour toutes les agences.", functionsCalled };
    }
    if (msg.includes("contact") || msg.includes("téléphone") || msg.includes("numero") || msg.includes("numéro")) {
      let contactReply = "📞 **Contacts de REGIONALE EXPRESS VOYAGES SARL :**\n\n";
      contactReply += "- **Contact Général & WhatsApp :** +237 694 32 85 84\n";
      contactReply += "- **Yaoundé Mimboman :** +237 698 55 28 04 / 692 86 62 25\n";
      contactReply += "- **Mbalmayo :** +237 696 40 29 83 / 655 84 79 90\n";
      contactReply += "- **Yaoundé Mvan :** +237 659 15 75 75 / 696 43 17 63\n\n";
      contactReply += "📧 Email : contact@regionalexpressvoyages.com";
      return { text: contactReply, functionsCalled };
    }
    if (msg.includes("carnet de régularité") || msg.includes("régularité") || msg.includes("fidelite") || msg.includes("fidélité") || msg.includes("avantages")) {
      return { text: "🏆 **Le Carnet de Régularité** vous offre de nombreux avantages selon votre fréquence de déplacement :\n\n- 🚀 **Embarquement prioritaire** (sans file d'attente)\n- 🎁 **Billets gratuits**\n- 📱 **Réservation (embarquement) à distance**\n\nPour souscrire, vous pouvez contacter le service client via WhatsApp au +237 694 32 85 84.", functionsCalled };
    }
    
    // 1.a Informations sur l'ERP et les Fonctionnalités
    if (msg.includes("erp") || msg.includes("logiciel") || msg.includes("fonctionnalité") || msg.includes("modules") || msg.includes("à propos")) {
      let erpReply = "💻 **REGIONALE EXPRESS VOYAGES SARL ERP (v1.0.0 Enterprise)**\n\n";
      erpReply += "Il s'agit de la plateforme de gestion centralisée développée exclusivement pour l'entreprise.\n\n";
      erpReply += "**Modules principaux :**\n- Recettes journalières\n- Dépenses\n- Versements bancaires (avec objectifs)\n- Synthèse financière & Net en Caisse\n- Gestion des fournisseurs\n\n";
      erpReply += "**Agences prises en charge :** Yaoundé Mvan, Yaoundé Mimboman, Mbalmayo, Ayos, Akonolinga.\n\n";
      erpReply += "L'application fonctionne en mode **Offline First**, ce qui permet de continuer à travailler même sans connexion internet, avec une synchronisation automatique au retour du réseau.";
      return { text: erpReply, functionsCalled };
    }
    
    if (msg.includes("rôle") || msg.includes("roles") || msg.includes("permissions") || msg.includes("agent") || msg.includes("dg") || msg.includes("pdg")) {
      if (msg.includes("erp") || msg.includes("logiciel") || msg.includes("qui peut")) {
        let rolesReply = "🔐 **Gestion des rôles dans l'ERP :**\n\n";
        rolesReply += "- **PDG :** Accès total. Peut tout créer, valider, modifier, supprimer, gérer les utilisateurs et voir toutes les synthèses.\n";
        rolesReply += "- **DG :** Accès complet à l'exploitation. Peut valider ou rejeter, mais ne peut pas créer/modifier/supprimer des utilisateurs.\n";
        rolesReply += "- **Agent de saisie :** Accès limité. Peut uniquement saisir des dépenses, recettes et versements. Aucune modification possible après saisie, aucune validation. Tout doit être approuvé par le PDG ou DG.";
        return { text: rolesReply, functionsCalled };
      }
    }

    // 1b. NET EN CAISSE (règle métier principale)
    if (msg.includes("net en caisse") || msg.includes("net caisse") || msg.includes("combien peut-on") || msg.includes("peut-on verser") || msg.includes("peut-on effectuer") || msg.includes("solde disponible") || msg.includes("caisse disponible") || msg.includes("capacité de versement")) {
      functionsCalled.push("getNetEnCaisse");
      const netData = await getNetEnCaisse();

      // Cas : "Peut-on effectuer cet achat de X FCFA ?"
      const montantMatch = userMsg.match(/(\d[\d\s]*)(\s?fcfa|\s?f\.cfa)?/i);
      if ((msg.includes("peut-on") || msg.includes("possible")) && montantMatch) {
        const montant = parseInt(montantMatch[1].replace(/\s/g, ''), 10);
        if (!isNaN(montant)) {
          const check = await canAffordOperation(montant);
          if (check.canAfford) {
            return { text: `✅ **Opération possible.**\n\nMontant demandé : **${montant.toLocaleString('fr-FR')} FCFA**\nNet en Caisse disponible : **${netData.netEnCaisse.toLocaleString('fr-FR')} FCFA**\n\nL'opération peut être effectuée.`, functionsCalled };
          } else {
            return { text: `❌ **Opération impossible.**\n\nMontant demandé : **${montant.toLocaleString('fr-FR')} FCFA**\nNet en Caisse disponible : **${netData.netEnCaisse.toLocaleString('fr-FR')} FCFA**\n\nLe Net en Caisse est insuffisant.`, functionsCalled };
          }
        }
      }

      // Cas général : afficher le Net en Caisse
      let reply = `💰 **NET EN CAISSE (Solde réel disponible en caisse) :**\n\n`;
      reply += `- **Recettes totales validées :** ${netData.recettesBrutes.toLocaleString('fr-FR')} FCFA\n`;
      reply += `- **Dépenses totales validées :** ${netData.totalDepenses.toLocaleString('fr-FR')} FCFA\n`;
      reply += `- **Versements bancaires validés :** ${netData.totalVersements.toLocaleString('fr-FR')} FCFA\n\n`;
      reply += `> **NET EN CAISSE = ${netData.netEnCaisse.toLocaleString('fr-FR')} FCFA**\n\n`;
      reply += `*Formule : Recettes − Dépenses − Versements*`;
      return { text: reply, functionsCalled };
    }

    // 1c. Qui a validé / créé / rejeté une opération ?
    if (msg.includes("qui a validé") || msg.includes("qui a rejeté") || msg.includes("qui l'a validé") || msg.includes("pourquoi refusé") || msg.includes("pourquoi rejeté")) {
      functionsCalled.push("getOperationHistory");
      const recentOps = await prisma.operation.findMany({
        where: { statut: { in: ['VALIDEE', 'REJETEE'] } },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          validateur: { select: { prenom: true, nom: true, role: true } },
          agent: { select: { prenom: true, nom: true } }
        }
      });
      if (recentOps.length === 0) return { text: "Aucune opération validée ou rejetée récemment.", functionsCalled };
      let reply = `📋 **Historique des validations/rejets récents :**\n\n`;
      recentOps.forEach(op => {
        const action = op.statut === 'VALIDEE' ? '\u2705 Validée' : '\u274c Rejetée';
        reply += `- **${op.type}** de ${op.montant.toLocaleString('fr-FR')} FCFA | Créé par ${op.agent?.prenom} ${op.agent?.nom} | ${action} par **${op.validateur?.prenom} ${op.validateur?.nom} (${op.validateur?.role})**\n`;
      });
      return { text: reply, functionsCalled };
    }

    // 2. Connexions (LoginLog) & Utilisateurs actifs
    if (msg.includes("qui s'est connecté") || msg.includes("qui est connecté") || msg.includes("journal des connexions") || msg.includes("déconnecté")) {
      functionsCalled.push("getLoginLogs");
      if (user.role !== 'PDG' && user.role !== 'DGA' && user.role !== 'DG') {
        return { text: "🔒 Accès refusé : Seule la direction peut consulter le journal des connexions globales.", functionsCalled };
      }
      
      if (msg.includes("actuellement")) {
        const activeUsers = await prisma.user.findMany({
          where: { 
            derniereConnexion: { not: null },
            OR: [
              { derniereDeconnexion: null },
              { derniereConnexion: { gt: prisma.user.fields.derniereDeconnexion } }
            ]
          },
          select: { prenom: true, nom: true, role: true }
        });
        if (activeUsers.length === 0) return { text: "Aucun utilisateur ne semble actuellement connecté.", functionsCalled };
        return { text: `🟢 **Utilisateurs actuellement connectés :**\n${activeUsers.map(u => `- ${u.prenom} ${u.nom} (${u.role})`).join('\n')}`, functionsCalled };
      }

      // If disconnected
      const isDisconnected = msg.includes("déconnecté") || msg.includes("deconnecte");

      const logs = await prisma.loginLog.findMany({
        where: {
          createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
          success: !isDisconnected
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { prenom: true, nom: true } } }
      });

      if (logs.length === 0) {
        return { text: `Aucune ${isDisconnected ? 'déconnexion' : 'connexion'} trouvée pour la période : ${dateRange.label}.`, functionsCalled };
      }

      return { text: `📜 **${isDisconnected ? 'Déconnexions' : 'Connexions'} (${dateRange.label}) :**\n${logs.map(l => `- ${l.user?.prenom} ${l.user?.nom} le ${l.createdAt.toLocaleString('fr-FR')}`).join('\n')}`, functionsCalled };
    }

    // 2b. Fournisseurs & Dettes
    if (msg.includes("fournisseur") || msg.includes("dette") || msg.includes("doit-on") || msg.includes("statut de paiement") || msg.includes("achat fournisseur")) {
      functionsCalled.push("getDettesFournisseurs");
      
      if (msg.includes("statut de paiement") || msg.includes("workflow")) {
        return { text: "📦 **Achats Fournisseurs et Statuts :**\n\n- **PAYÉ :** Le montant versé est égal au total de l'achat. Reste à payer = 0.\n- **IMPAYÉ :** Aucun versement n'a été effectué. Le total est dû.\n- **AVANCE :** Un paiement partiel a été effectué.\n\n⚠️ Le Net en Caisse n'est diminué que du montant réellement versé.", functionsCalled };
      }

      if (user.role !== 'PDG' && user.role !== 'DG') {
        return { text: "🔒 Accès refusé : Seule la direction peut consulter la liste des dettes fournisseurs.", functionsCalled };
      }

      const { getDettesFournisseurs } = await import('@/actions/detteActions');
      const res = await getDettesFournisseurs();
      
      if (!res.success || !res.data || res.data.length === 0) {
        return { text: "✅ Aucune dette fournisseur n'a été trouvée.", functionsCalled };
      }

      let reply = `🛒 **Dettes Fournisseurs :**\n\n`;
      let totalGlobalReste = 0;
      
      res.data.forEach(d => {
        totalGlobalReste += d.resteAPayer;
        if (msg.includes(d.nom.toLowerCase())) {
          reply += `- **${d.nom}** : Total des achats = ${d.totalAchats.toLocaleString('fr-FR')} FCFA | Reste à payer = **${d.resteAPayer.toLocaleString('fr-FR')} FCFA**\n`;
        }
      });

      if (!msg.includes("fournisseur") && msg.includes("doit-on")) {
        // Simple global answer
        return { text: `💰 Nous devons un total de **${totalGlobalReste.toLocaleString('fr-FR')} FCFA** à l'ensemble de nos fournisseurs.`, functionsCalled };
      }
      
      if (reply === `🛒 **Dettes Fournisseurs :**\n\n`) {
        // List all
        res.data.forEach(d => {
          reply += `- **${d.nom}** : Reste à payer = **${d.resteAPayer.toLocaleString('fr-FR')} FCFA**\n`;
        });
        reply += `\n> **TOTAL DES DETTES : ${totalGlobalReste.toLocaleString('fr-FR')} FCFA**`;
      }
      
      return { text: reply, functionsCalled };
    }

    // 4. Audit & Traçabilité (Qui a fait quoi)
    if (msg.includes("qui a validé") || msg.includes("qui a modifié") || msg.includes("qui a cree") || msg.includes("qui a créé") || msg.includes("audit") || msg.includes("tracabilite") || msg.includes("traçabilité")) {
      functionsCalled.push("getAuditLogs");
      if (user.role !== 'PDG' && user.role !== 'DGA' && user.role !== 'DG') {
        return { text: "🔒 Accès refusé : Seule la direction peut consulter les journaux d'audit.", functionsCalled };
      }

      const audits = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { prenom: true, nom: true, role: true } } }
      });

      if (audits.length === 0) {
        return { text: `Aucune action critique trouvée dans les registres pour la période : ${dateRange.label}.`, functionsCalled };
      }

      let reply = `🔍 **Journal d'Audit - 10 dernières actions (${dateRange.label}) :**\n\n`;
      audits.forEach(a => {
        reply += `- **${a.user?.prenom} ${a.user?.nom} (${a.user?.role})** a effectué l'action *${a.action}* sur l'entité *${a.tableName}* (ID: ${a.recordId.slice(0, 8)}...) le ${a.createdAt.toLocaleString('fr-FR')}\n`;
      });
      return { text: reply, functionsCalled };
    }

    // 3. Bilan Complet ou Lignes ou Agences
    if (msg.includes("bilan") || msg.includes("complet") || msg.includes("rapport") || msg.includes("ligne 1") || msg.includes("ligne 2") || msg.includes("net global") || agencyQuery) {
      functionsCalled.push("generateComprehensiveBilan");
      
      if (msg.includes("ligne 1") || msg.includes("ligne 2") || msg.includes("net global") || agencyQuery) {
        // Use Synthese logic
        const { getSyntheseLignesData } = await import('@/actions/syntheseActions');
        const res = await getSyntheseLignesData("ALL", dateRange.startDate.toISOString(), dateRange.endDate.toISOString());
        
        if (res.success && res.data) {
          const data = res.data;
          let reply = `📊 **Bilan Financier Spécifique (${dateRange.label}) :**\n\n`;
          
          if (agencyQuery) {
            const allAgencies = [...data.ligne1.agencies, ...data.ligne2.agencies];
            const foundAgency = allAgencies.find(a => a.nom.toLowerCase().includes(agencyQuery));
            if (foundAgency) {
              reply += `🏢 **AGENCE ${foundAgency.nom.toUpperCase()} :**\n- Recettes : ${foundAgency.recettes.toLocaleString('fr-FR')} FCFA\n\n`;
            } else {
              reply += `❌ **AGENCE ${agencyQuery.toUpperCase()} :** Aucune donnée ou agence introuvable.\n\n`;
            }
          }
          if (msg.includes("ligne 1")) {
            const netL1 = data.ligne1.recettes - data.ligne1.depenses;
            reply += `🚆 **LIGNE 1 (Mbalmayo, Mvan) :**\n- Recettes : ${data.ligne1.recettes.toLocaleString('fr-FR')} FCFA\n- Dépenses : ${data.ligne1.depenses.toLocaleString('fr-FR')} FCFA\n- **NET EN CAISSE : ${netL1.toLocaleString('fr-FR')} FCFA**\n\n`;
          }
          if (msg.includes("ligne 2")) {
            const netL2 = data.ligne2.recettes - data.ligne2.depenses;
            reply += `🚆 **LIGNE 2 (Mimboman, Ayos, Akonolinga) :**\n- Recettes : ${data.ligne2.recettes.toLocaleString('fr-FR')} FCFA\n- Dépenses : ${data.ligne2.depenses.toLocaleString('fr-FR')} FCFA\n- **NET EN CAISSE : ${netL2.toLocaleString('fr-FR')} FCFA**\n\n`;
          }
          if (msg.includes("net global") || msg.includes("global")) {
            const net = data.global.recettes - data.global.depenses;
            reply += `🌍 **BILAN GLOBAL :**\n- Total Recettes : ${data.global.recettes.toLocaleString('fr-FR')} FCFA\n- Toutes Dépenses : ${data.global.depenses.toLocaleString('fr-FR')} FCFA\n- **NET GLOBAL : ${net.toLocaleString('fr-FR')} FCFA**\n`;
          }
          return { text: reply, functionsCalled };
        }
      }

      const reply = await generateComprehensiveBilan(dateRange, user);
      return { text: reply, functionsCalled };
    }

    // 3b. Totaux simples — accessibles à tous les utilisateurs authentifiés
    if (msg.includes("total") || msg.includes("dépensé") || msg.includes("depense") || msg.includes("chiffre d'affaires") || msg.includes("ca") || msg.includes("versement bancaire") || msg.includes("recette") || msg.includes("solde théorique") || msg.includes("solde theorique")) {
      functionsCalled.push("getDashboardStats");
      
      const stats = await getPDGDashboardStats("ALL", "ALL", dateRange.startDate.toISOString(), dateRange.endDate.toISOString());
      
      let reply = `📊 **Aperçu Financier (${dateRange.label}) :**\n`;
      
      if (msg.includes("dépensé") || msg.includes("depense")) {
        reply = `💸 **Total des dépenses (${dateRange.label}) :** ${stats.expenseMonth.toLocaleString('fr-FR')} FCFA\n`;
      } else if (msg.includes("recette")) {
        reply = `📈 **Total des recettes journalières (${dateRange.label}) :** ${stats.totalRecettes?.toLocaleString('fr-FR') || 0} FCFA\n`;
      } else if (msg.includes("versement bancaire")) {
        reply = `💰 **Total des versements bancaires (${dateRange.label}) :** ${stats.totalDeposits.toLocaleString('fr-FR')} FCFA\n`;
      } else if (msg.includes("solde")) {
        reply = `⚖️ **Solde Théorique (${dateRange.label}) :** ${stats.theoreticalBalance.toLocaleString('fr-FR')} FCFA\n`;
      } else {
        reply += `- **Total Recettes :** ${stats.totalRecettes?.toLocaleString('fr-FR') || 0} FCFA\n`;
        reply += `- **Total Dépenses :** ${stats.expenseMonth.toLocaleString('fr-FR')} FCFA\n`;
        reply += `- **Total Versements bancaires :** ${stats.totalDeposits.toLocaleString('fr-FR')} FCFA\n`;
        reply += `- **Solde Théorique :** ${stats.theoreticalBalance.toLocaleString('fr-FR')} FCFA\n`;
      }
      
      return { text: reply, functionsCalled };
    }

    // 4. Banques et Objectifs
    if (msg.includes("objectif") || msg.includes("banque")) {
      functionsCalled.push("getBankObjectives");
      if (user.role !== 'PDG' && user.role !== 'DG') return { text: "🔒 Réservé au PDG ou au DG.", functionsCalled };

      const objectives = await prisma.bankObjective.findMany({
        where: {
          dateDebut: { lte: dateRange.endDate },
          dateFin: { gte: dateRange.startDate }
        },
        include: { bank: true }
      });

      if (objectives.length === 0) return { text: `Aucun objectif défini pour la période : ${dateRange.label}.`, functionsCalled };

      if (msg.includes("global")) {
        let globalObj = 0;
        let globalAtt = 0;
        for (const obj of objectives) {
          globalObj += obj.montant;
          const totalDeps = await prisma.operation.aggregate({
            _sum: { montant: true },
            where: { bankId: obj.bankId, type: 'VERSEMENT', statut: 'VALIDEE', createdAt: { gte: obj.dateDebut, lte: obj.dateFin } }
          });
          globalAtt += totalDeps._sum.montant || 0;
        }
        const perc = globalObj > 0 ? (globalAtt / globalObj) * 100 : 0;
        return { text: `🌐 **Objectif Bancaire Global (${dateRange.label}) :**\n- **Total Fixé :** ${globalObj.toLocaleString('fr-FR')} FCFA\n- **Total Atteint :** ${globalAtt.toLocaleString('fr-FR')} FCFA (${perc.toFixed(1)}%)`, functionsCalled };
      }

      let reply = `🏦 **Objectifs Bancaires (${dateRange.label}) :**\n`;
      let retardBank = "";
      let performanteBank = "";
      let maxPerc = -1;
      let minPerc = 9999;

      for (const obj of objectives) {
        // Calculate deposits for this bank during the objective period
        const totalDeps = await prisma.operation.aggregate({
          _sum: { montant: true },
          where: { bankId: obj.bankId, type: 'VERSEMENT', statut: 'VALIDEE', createdAt: { gte: obj.dateDebut, lte: obj.dateFin } }
        });
        const deps = totalDeps._sum.montant || 0;
        const perc = (deps / obj.montant) * 100;
        const missing = obj.montant - deps;
        
        if (perc > maxPerc) { maxPerc = perc; performanteBank = obj.bank.nom; }
        if (perc < minPerc) { minPerc = perc; retardBank = obj.bank.nom; }
        
        reply += `- **${obj.bank.nom}** : ${deps.toLocaleString('fr-FR')} / ${obj.montant.toLocaleString('fr-FR')} FCFA (${perc.toFixed(1)}%)\n`;
        if (msg.includes("manque") && missing > 0) {
          reply += `  *Il manque ${missing.toLocaleString('fr-FR')} FCFA.*\n`;
        }
      }

      if (msg.includes("en retard")) {
        return { text: `🐢 La banque la plus en retard est **${retardBank}** avec seulement ${minPerc.toFixed(1)}% de son objectif atteint.`, functionsCalled };
      }
      if (msg.includes("atteint") && !msg.includes("pourcentage")) {
        return { text: `🏆 La banque la plus performante est **${performanteBank}** avec ${maxPerc.toFixed(1)}% de son objectif atteint.\n\n` + reply, functionsCalled };
      }

      return { text: reply, functionsCalled };
    }

    // 5. Versements bancaires spécifiques par banque
    if (msg.includes("versé chez") || msg.includes("verse chez")) {
      functionsCalled.push("getBankDeposits");
      if (user.role !== 'PDG' && user.role !== 'DG') return { text: "🔒 Réservé à la direction.", functionsCalled };

      if (!bankQuery) {
        return { text: "De quelle banque parlez-vous ? (ex: Afriland, UBA, SG, BICEC)", functionsCalled };
      }

      const bank = await prisma.bank.findFirst({
        where: { nom: { contains: bankQuery, mode: 'insensitive' } }
      });

      if (!bank) return { text: `Banque "${bankQuery}" introuvable.`, functionsCalled };

      const ops = await prisma.operation.aggregate({
        _sum: { montant: true },
        where: { type: 'VERSEMENT', statut: 'VALIDEE', bankId: bank.id, createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
      });

      const total = ops._sum.montant || 0;
      return { text: `🏦 Nous avons versé **${total.toLocaleString('fr-FR')} FCFA** chez **${bank.nom}** (${dateRange.label}).`, functionsCalled };
    }

    // 6. Agence qui dépense le plus
    if (msg.includes("agence") && (msg.includes("dépense le plus") || msg.includes("depense le plus"))) {
      functionsCalled.push("getAgencyExpenses");
      if (user.role !== 'PDG' && user.role !== 'DG') return { text: "🔒 Réservé à la direction générale.", functionsCalled };
      
      const ops = await prisma.operation.groupBy({
        by: ['agencyId'],
        where: { type: 'DEPENSE', statut: 'VALIDEE', createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
        _sum: { montant: true },
        orderBy: { _sum: { montant: 'desc' } },
        take: 3
      });
      
      if (ops.length === 0) return { text: `Aucune dépense trouvée pour ${dateRange.label}.`, functionsCalled };
      
      const topAgencyId = ops[0].agencyId;
      const agency = await prisma.agency.findUnique({ where: { id: topAgencyId } });
      
      return { text: `🏢 L'agence qui a le plus dépensé (${dateRange.label}) est **${agency?.nom || 'Inconnue'}** avec un total de **${(ops[0]._sum.montant || 0).toLocaleString('fr-FR')} FCFA**.`, functionsCalled };
    }
    
    // 7. Catégorie qui coûte le plus
    if (msg.includes("catégorie") && (msg.includes("coûte le plus") || msg.includes("coute le plus"))) {
      functionsCalled.push("getCategoryExpenses");
      
      const ops = await prisma.operation.groupBy({
        by: ['categoryId'],
        where: { type: 'DEPENSE', statut: 'VALIDEE', createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }, ...agencyFilter },
        _sum: { montant: true },
        orderBy: { _sum: { montant: 'desc' } },
        take: 1
      });
      
      if (ops.length === 0) return { text: `Aucune dépense trouvée pour ${dateRange.label}.`, functionsCalled };
      
      const topCatId = ops[0].categoryId;
      const category = topCatId ? await prisma.category.findUnique({ where: { id: topCatId } }) : null;
      
      return { text: `🏷️ La catégorie qui a coûté le plus cher (${dateRange.label}) est **${category?.nom || 'Inconnue'}** avec un total de **${(ops[0]._sum.montant || 0).toLocaleString('fr-FR')} FCFA**.`, functionsCalled };
    }

    // 8. Opérations en attente
    if (msg.includes("en attente") || msg.includes("validation")) {
      functionsCalled.push("getPendingOperations");
      const isDepense = msg.includes("dépense") || msg.includes("depense");
      const isVersement = msg.includes("versement");
      const isRecette = msg.includes("recette");
      
      const type = isVersement ? 'VERSEMENT' : (isDepense ? 'DEPENSE' : (isRecette ? 'RECETTE' : undefined));
      
      const pendingCount = await prisma.operation.count({ 
        where: { 
          ...(type ? { type } : {}), 
          statut: 'EN_ATTENTE',
          createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
          ...(user.role === 'CHEF_AGENCE' || user.role === 'AGENT' ? { agencyId: user.agencyId || undefined } : {})
        }
      });
      
      return { text: `⏳ Il y a actuellement **${pendingCount}** opération(s) en attente de validation${user.role === 'PDG' ? ' au total' : ' dans votre agence'} pour la période : ${dateRange.label}.`, functionsCalled };
    }

    // 8b. Qui a validé / créé / rejeté
    if (msg.includes("qui a validé") || msg.includes("qui a rejete") || msg.includes("qui a rejeté") || msg.includes("qui a créé") || msg.includes("quel agent a créé")) {
      functionsCalled.push("getOperationAudit");
      
      const isValidation = msg.includes("qui a validé") || msg.includes("valide");
      const isRejet = msg.includes("qui a rejeté") || msg.includes("qui a rejete");
      const isCreation = msg.includes("qui a créé") || msg.includes("quel agent a créé") || msg.includes("cree");

      const typeFilter = msg.includes("recette") ? "RECETTE" : msg.includes("dépense") || msg.includes("depense") ? "DEPENSE" : msg.includes("versement") ? "VERSEMENT" : undefined;

      const ops = await prisma.operation.findMany({
        where: {
          dateOperation: { gte: dateRange.startDate, lte: dateRange.endDate },
          ...(typeFilter ? { type: typeFilter as any } : {}),
          ...(isValidation ? { statut: { in: ['VALIDEE', 'VALIDEE_DG'] }, validateurId: { not: null } } : {}),
          ...(isRejet ? { statut: 'REJETEE', validateurId: { not: null } } : {}),
          ...agencyFilter
        },
        include: {
          agent: { select: { prenom: true, nom: true, role: true } },
          validateur: { select: { prenom: true, nom: true, role: true } }
        },
        orderBy: { dateOperation: 'desc' },
        take: 5
      });

      if (ops.length === 0) {
        return { text: `Aucune donnée trouvée pour cette requête sur la période : ${dateRange.label}.`, functionsCalled };
      }

      let reply = `🔍 **Résultats pour : ${isValidation ? 'Validations' : isRejet ? 'Rejets' : 'Créations'} (${dateRange.label})**\n`;
      ops.forEach(op => {
        const acteur = isValidation || isRejet ? op.validateur : op.agent;
        const actionStr = isValidation ? "validé" : isRejet ? "rejeté" : "créé";
        reply += `- **${op.type}** de ${op.montant.toLocaleString('fr-FR')} FCFA ${actionStr} par **${acteur?.prenom || 'Inconnu'} ${acteur?.nom || ''}** (${acteur?.role || 'Rôle inconnu'})\n`;
      });
      
      if (ops.length === 5) {
        reply += `\n*Seules les 5 opérations les plus récentes sont affichées.*`;
      }

      return { text: reply, functionsCalled };
    }

    // 8c. Agences spécifiques (ex: bilan de l'agence Douala)
    const agencyRegex = /bilan de (?:l'agence )?([a-zA-Zàâéèêëîïôùûüç\s]+)/i;
    const agencyMatch = msg.match(agencyRegex);
    if (agencyMatch && agencyMatch[1]) {
      const agencyName = agencyMatch[1].trim();
      if (!msg.includes("global") && !msg.includes("général")) {
        const agency = await prisma.agency.findFirst({
          where: { nom: { contains: agencyName, mode: 'insensitive' } }
        });
        if (agency) {
          const customUser = { ...user, agencyId: agency.id, role: 'CHEF_AGENCE' }; // simulate restricted scope
          const reply = await generateComprehensiveBilan(dateRange, customUser as any);
          return { text: reply, functionsCalled };
        }
      }
    }

    // 8d. Fournisseurs
    if (msg.includes("fournisseur")) {
      functionsCalled.push("getFournisseurs");
      const fournisseurs = await prisma.fournisseur.findMany({ where: { statut: 'ACTIF' }});
      const paiements = await prisma.operation.aggregate({
        _sum: { montant: true },
        where: { type: 'PAIEMENT_FOURNISSEUR', statut: 'VALIDEE', createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
      });
      return { text: `🚚 Nous avons **${fournisseurs.length} fournisseurs actifs**.\n💰 Total payé aux fournisseurs (${dateRange.label}) : **${(paiements._sum.montant || 0).toLocaleString('fr-FR')} FCFA**.`, functionsCalled };
    }

    // 8e. Synthèse Lignes
    if (msg.includes("ligne 1") || msg.includes("ligne 2") || msg.includes("lignes") || msg.includes("synthèse") || msg.includes("synthese")) {
      functionsCalled.push("getSyntheseLignesData");
      const from = dateRange.startDate.toISOString();
      const to = dateRange.endDate.toISOString();
      const { getSyntheseLignesData } = await import('@/actions/syntheseActions');
      const res = await getSyntheseLignesData("DAY", from, to); 
      if (res?.success) {
        const d = res.data;
        let txt = `📈 **Synthèse des Lignes (${dateRange.label}) :**\n`;
        if (msg.includes("ligne 1") || msg.includes("lignes") || msg.includes("synthèse") || msg.includes("synthese")) {
          txt += `- **Ligne 1** (Recettes: ${d.ligne1.recettes.toLocaleString('fr-FR')} FCFA | Dépenses: ${d.ligne1.depenses.toLocaleString('fr-FR')} FCFA | Net: ${(d.ligne1.recettes - d.ligne1.depenses).toLocaleString('fr-FR')} FCFA)\n`;
        }
        if (msg.includes("ligne 2") || msg.includes("lignes") || msg.includes("synthèse") || msg.includes("synthese")) {
          txt += `- **Ligne 2** (Recettes: ${d.ligne2.recettes.toLocaleString('fr-FR')} FCFA | Dépenses: ${d.ligne2.depenses.toLocaleString('fr-FR')} FCFA | Net: ${(d.ligne2.recettes - d.ligne2.depenses).toLocaleString('fr-FR')} FCFA)\n`;
        }
        return { text: txt, functionsCalled };
      }
    }

    // 9. Utilisateurs Suspendus
    if (msg.includes("suspendu")) {
      functionsCalled.push("getSuspendedUsers");
      const suspended = await prisma.user.findMany({
        where: { isActive: false, ...agencyFilter },
        select: { prenom: true, nom: true, role: true }
      });
      if (suspended.length === 0) return { text: "Aucun utilisateur n'est actuellement suspendu.", functionsCalled };
      return { text: `🚫 **Utilisateurs suspendus :**\n${suspended.map(u => `- ${u.prenom} ${u.nom} (${u.role})`).join('\n')}`, functionsCalled };
    }

  } catch (err) {
    console.error("Erreur dans aiRouter:", err);
    responseText = "❌ Une erreur s'est produite lors de la recherche dans la base de données.";
  }

  return { text: responseText, functionsCalled };
}

// -------------------------------------------------------------
// NOUVEAU : GÉNÉRATEUR DE BILAN COMPLET
// -------------------------------------------------------------
async function generateComprehensiveBilan(dateRange: DateRange, user: SessionPayload & { role: string; agencyId?: string | null }) {
  // Respecter la RLS et les permissions
  const isGlobal = (user.role === 'PDG' || user.role === 'DG' || user.role === 'DGA');
  const agencyFilter = isGlobal ? {} : { agencyId: user.agencyId! };

  // Dépenses
  const depenses = await prisma.operation.groupBy({
    by: ['statut'],
    where: { type: { in: ['DEPENSE', 'PAIEMENT_FOURNISSEUR'] }, createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }, ...agencyFilter },
    _count: true,
    _sum: { montant: true }
  });
  
  // Versements bancaires
  const versements = await prisma.operation.groupBy({
    by: ['statut'],
    where: { type: 'VERSEMENT', createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }, ...agencyFilter },
    _count: true,
    _sum: { montant: true }
  });

  // Recettes journalières
  const recettes = await prisma.operation.groupBy({
    by: ['statut'],
    where: { type: 'RECETTE', createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }, ...agencyFilter },
    _count: true,
    _sum: { montant: true }
  });

  // Helper
  const extractStat = (data: any[], statut: string) => {
    const item = data.find(d => d.statut === statut);
    return { count: item?._count || 0, sum: item?._sum?.montant || 0 };
  };

  const totalDepenses = depenses.reduce((acc, curr) => acc + (curr._sum.montant || 0), 0);
  const countDepenses = depenses.reduce((acc, curr) => acc + curr._count, 0);
  const depensesValidees = extractStat(depenses, 'VALIDEE');
  const depensesRejetees = extractStat(depenses, 'REJETEE');

  const totalVersementsBancaires = versements.reduce((acc, curr) => acc + (curr._sum.montant || 0), 0);
  const countVersementsBancaires = versements.reduce((acc, curr) => acc + curr._count, 0);
  const versementsValides = extractStat(versements, 'VALIDEE');
  const versementsRejetes = extractStat(versements, 'REJETEE');

  const totalRecettes = recettes.reduce((acc, curr) => acc + (curr._sum.montant || 0), 0);
  const countRecettes = recettes.reduce((acc, curr) => acc + curr._count, 0);
  const recettesValidees = extractStat(recettes, 'VALIDEE');
  const recettesValideesDG = extractStat(recettes, 'VALIDEE_DG');
  const recettesRejetees = extractStat(recettes, 'REJETEE');

  const sumRecettes = recettesValidees.sum + recettesValideesDG.sum;

  let report = `## Bilan complet\n\n`;
  report += `**Date concernée :** ${dateRange.label}\n\n`;
  
  if (!isGlobal) {
    report += `> ℹ️ *Vue restreinte : Les données affichées correspondent uniquement à votre agence.*\n\n`;
  }

  report += `### Résumé général\n\n`;
  report += `- **Nombre total de recettes :** ${countRecettes} (dont ${recettesValidees.count + recettesValideesDG.count} validées, ${recettesRejetees.count} rejetées)\n`;
  report += `- **Montant des recettes (Validées) :** ${sumRecettes.toLocaleString('fr-FR')} FCFA\n\n`;

  report += `- **Nombre total de dépenses :** ${countDepenses} (dont ${depensesValidees.count} validées, ${depensesRejetees.count} rejetées)\n`;
  report += `- **Montant des dépenses (Validées) :** ${depensesValidees.sum.toLocaleString('fr-FR')} FCFA\n\n`;
  
  report += `- **Versements bancaires**: ${totalVersementsBancaires.toLocaleString('fr-FR')} FCFA (${countVersementsBancaires} opérations, dont ${versementsValides.count} validées, ${versementsRejetes.count} rejetées)\n`;
  report += `- **Montant des versements (Validés) :** ${versementsValides.sum.toLocaleString('fr-FR')} FCFA\n\n`;

  // Solde théorique
  const solde = versementsValides.sum - depensesValidees.sum;
  report += `**Solde Théorique (Versements - Dépenses) :** ${solde.toLocaleString('fr-FR')} FCFA\n\n`;

  // Détails Versements bancaires par Banque
  report += `### Détail des versements par banque\n\n`;
  const banks = await prisma.bank.findMany();
  
  let globalObjective = 0;
  let globalVersed = 0;

  for (const bank of banks) {
    let bankObjectiveAmount = 0;
    
    if (isGlobal) {
      const bankObjectives = await prisma.bankObjective.findMany({
        where: { bankId: bank.id, dateDebut: { lte: dateRange.endDate }, dateFin: { gte: dateRange.startDate } }
      });
      bankObjectiveAmount = bankObjectives.reduce((sum, obj) => sum + obj.montant, 0);
      globalObjective += bankObjectiveAmount;
    }

    const bankVersementsBancaires = await prisma.operation.aggregate({
      where: { bankId: bank.id, type: 'VERSEMENT', statut: 'VALIDEE', createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }, ...agencyFilter },
      _sum: { montant: true }
    });
    const versed = bankVersementsBancaires._sum.montant || 0;
    globalVersed += versed;

    if (bankObjectiveAmount > 0 || versed > 0) {
      report += `**${bank.nom} :**\n`;
      if (isGlobal) {
        report += `- Objectif : ${bankObjectiveAmount > 0 ? bankObjectiveAmount.toLocaleString('fr-FR') + ' FCFA' : 'Non défini'}\n`;
      }
      report += `- Montant versé : ${versed.toLocaleString('fr-FR')} FCFA\n`;
      if (isGlobal && bankObjectiveAmount > 0) {
        const perc = (versed / bankObjectiveAmount) * 100;
        report += `- Pourcentage atteint : ${perc.toFixed(2)}%\n`;
      }
      report += `\n`;
    }
  }

  if (isGlobal && globalObjective > 0) {
    report += `**Objectif bancaire global :** ${globalObjective.toLocaleString('fr-FR')} FCFA\n`;
    report += `**Montant global versé (Validé) :** ${globalVersed.toLocaleString('fr-FR')} FCFA\n`;
    const globalPerc = (globalVersed / globalObjective) * 100;
    report += `**Pourcentage global atteint :** ${globalPerc.toFixed(2)}%\n\n`;
  } else if (isGlobal) {
    report += `**Montant global versé (Validé) :** ${globalVersed.toLocaleString('fr-FR')} FCFA\n\n`;
  }

  // Utilisateurs
  report += `### Liste des principales opérations réalisées\n\n`;
  const usersWithOps = await prisma.operation.groupBy({
    by: ['agentId'],
    where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }, ...agencyFilter },
    _count: true
  });
  
  if (usersWithOps.length > 0) {
    report += `**Utilisateurs ayant effectué des opérations :**\n`;
    for (const u of usersWithOps) {
      if (!u.agentId) continue;
      const userObj = await prisma.user.findUnique({ where: { id: u.agentId }, select: { prenom: true, nom: true }});
      if (userObj) {
        report += `- ${userObj.prenom} ${userObj.nom} (${u._count} opération(s))\n`;
      }
    }
    report += `\n`;
  } else {
    report += `*Aucune opération enregistrée par des utilisateurs.*\n\n`;
  }

  // Validations
  if (isGlobal) {
    const validations = await prisma.operation.count({
      where: { statut: 'VALIDEE', validateurId: { not: null }, updatedAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
    });
    report += `### Validations\n\n`;
    report += `- **Validations réalisées par la direction :** ${validations} opération(s) validée(s).\n\n`;
  }

  // Logs / Evenements
  if (isGlobal) {
    report += `### Événements du journal\n\n`;
    const logins = await prisma.loginLog.count({
      where: { success: true, createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
    });
    const failedLogins = await prisma.loginLog.count({
      where: { success: false, createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
    });
    report += `- **Connexions réussies :** ${logins}\n`;
    report += `- **Tentatives échouées :** ${failedLogins}\n\n`;
  }

  return report;
}
