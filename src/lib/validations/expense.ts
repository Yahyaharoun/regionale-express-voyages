import { z } from "zod";

export const expenseSchema = z.object({
  montant: z.number({
    required_error: "Le montant est requis",
    invalid_type_error: "Le montant doit être un nombre",
  })
  .positive("Le montant doit être strictement positif")
  .max(10000000, "Le montant maximum autorisé est de 10M FCFA"),
  
  commentaire: z.string()
  .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
  .optional(),
  
  categoryId: z.string().uuid("L'identifiant de la catégorie doit être un UUID valide"),
  
  agencyId: z.string().uuid("L'identifiant de l'agence doit être un UUID valide")
});
