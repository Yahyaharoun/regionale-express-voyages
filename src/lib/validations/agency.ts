import { z } from "zod";

export const agencySchema = z.object({
  nom: z.string().min(2, "Le nom de l'agence doit contenir au moins 2 caractères.").max(100, "Le nom est trop long."),
  ville: z.string().min(2, "La ville doit contenir au moins 2 caractères.").max(100, "La ville est trop longue."),
  adresse: z.string().max(255).optional().nullable(),
  telephone: z.string().max(20).optional().nullable(),
  responsable: z.string().max(100).optional().nullable(),
});

export type AgencyFormData = z.infer<typeof agencySchema>;
