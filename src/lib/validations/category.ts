import * as z from "zod";

export const categorySchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});
