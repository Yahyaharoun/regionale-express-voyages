const fs = require('fs');

const file = 'src/actions/operationActions.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { recetteSchema }')) {
  content = content.replace(
    'import { depositSchema } from "@/lib/validations/deposit";',
    'import { depositSchema } from "@/lib/validations/deposit";\nimport { recetteSchema } from "@/lib/validations/recette";'
  );
}

const recetteFunction = `

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

    if (dbUser.role !== 'CAISSIER' && dbUser.role !== 'DGA' && dbUser.role !== 'CHEF_AGENCE' && dbUser.role !== 'COMPTABLE' && dbUser.role !== 'PDG' && dbUser.role !== 'DG' && dbUser.role !== 'AGENT') {
      return { error: "Permission refusée. Vous ne pouvez pas créer de recette." };
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
      commentaire: formData.get("commentaire") as string,
      agencyId: targetAgencyId,
      statut: formData.get("statut") as any || "EN_ATTENTE",
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

    const operation = await OperationRepository.create({
      type: "RECETTE",
      statut: rawData.statut,
      montant,
      commentaire,
      justificatifs: justificatifUrls,
      agency: { connect: { id: targetAgencyId } },
      agent: { connect: { id: agentId } },
    }, agentId, targetAgencyId);

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
            message: \`Recette de \${montant.toLocaleString('fr-FR')} FCFA soumise par \${dbUser.prenom} \${dbUser.nom}.\`,
            type: "INFO",
            operationId: operation.id
          }))
        });

        await sendPushNotification({
           title: rawData.statut === "VALIDEE" ? "Nouvelle Recette" : "Nouvelle Recette à valider",
           body: \`Recette de \${montant.toLocaleString('fr-FR')} FCFA soumise par \${dbUser.prenom} \${dbUser.nom}\`,
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
`;

if (!content.includes('export async function createRecetteAction')) {
  content += recetteFunction;
}

fs.writeFileSync(file, content);
