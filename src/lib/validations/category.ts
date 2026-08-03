import * as z from "zod";

export const categorySchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  groupe: z.string().min(2, "Le groupe est requis"),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});
