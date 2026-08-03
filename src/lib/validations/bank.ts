import * as z from "zod";

export const bankSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  numeroCompte: z.string().min(5, "Le numéro de compte est trop court"),
  agenceBancaire: z.string().optional(),
  devise: z.string().optional(),
  objectifMensuel: z.string().optional(), // Store as string in form and parse to int
  isActive: z.boolean().optional()
});
