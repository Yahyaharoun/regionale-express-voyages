const fs = require('fs');

const file = 'src/actions/operationActions.ts';
let content = fs.readFileSync(file, 'utf8');

const recetteFunction = `

export async function updateRecetteAction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non autorisé." };

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "Utilisateur non trouvé." };

    const existingOp = await prisma.operation.findUnique({ where: { id } });
    if (!existingOp) return { error: "Recette introuvable." };

    if (existingOp.agentId !== dbUser.id && dbUser.role !== 'DG' && dbUser.role !== 'PDG' && dbUser.role !== 'CHEF_AGENCE') {
      return { error: "Permission refusée. Vous ne pouvez modifier que vos propres recettes." };
    }

    if (existingOp.statut === "VALIDEE") {
      return { error: "Impossible de modifier une recette déjà validée." };
    }

    const rawData = {
      montant: parseInt(formData.get("montant") as string, 10),
      commentaire: formData.get("commentaire") as string,
      agencyId: existingOp.agencyId,
    };
    
    const validatedFields = recetteSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { montant, commentaire } = validatedFields.data;

    const operation = await prisma.operation.update({
      where: { id },
      data: {
        montant,
        commentaire,
      }
    });

    revalidatePath("/dashboard/recettes");
    revalidatePath("/dashboard");
    return { success: true, data: operation };
  } catch (error) {
    console.error("Error updating recette:", error);
    return { error: "Une erreur s'est produite lors de la modification de la recette." };
  }
}
`;

if (!content.includes('export async function updateRecetteAction')) {
  content += recetteFunction;
}

fs.writeFileSync(file, content);
