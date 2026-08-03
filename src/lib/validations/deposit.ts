import { z } from "zod";

export const depositSchema = z.object({
  montant: z.number({
    required_error: "Le montant est requis",
    invalid_type_error: "Le montant doit être un nombre",
  })
  .positive("Le montant doit être strictement positif")
  .max(50000000, "Le montant maximum autorisé est de 50M FCFA"),
  
  reference: z.string()
  .min(3, "La référence doit contenir au moins 3 caractères")
  .max(100, "La référence ne peut pas dépasser 100 caractères"),
  
  bankId: z.string().uuid("L'identifiant de la banque doit être un UUID valide"),
  
  agencyId: z.string().uuid("L'identifiant de l'agence doit être un UUID valide")
});
