import { z } from "zod";

export const recetteSchema = z.object({
  montant: z.number({
    required_error: "Le montant est requis",
    invalid_type_error: "Le montant doit être un nombre",
  })
  .positive("Le montant doit être strictement positif")
  .max(500000000, "Le montant maximum autorisé est de 500M FCFA"),
  
  commentaire: z.string()
  .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
  .optional()
  .nullable(),
  
  agencyId: z.string().uuid("L'identifiant de l'agence doit être un UUID valide"),
  
  typeRecette: z.enum(["CLASSIQUE", "VIP"], {
    required_error: "Le type de recette est requis",
    invalid_type_error: "Le type de recette doit être CLASSIQUE ou VIP",
  }).default("CLASSIQUE"),
});
