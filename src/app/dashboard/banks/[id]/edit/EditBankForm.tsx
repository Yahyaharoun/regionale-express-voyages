"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Landmark, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateBankAction } from "@/actions/bankActions";
import { bankSchema } from "@/lib/validations/bank";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BankFormValues = z.infer<typeof bankSchema>;

export function EditBankForm({ bank, objective }: { bank: any, objective: number }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      nom: bank.nom,
      numeroCompte: bank.numeroCompte,
      agenceBancaire: bank.agenceBancaire || undefined,
      devise: bank.devise,
      objectifMensuel: objective ? objective.toString() : undefined,
    }
  });

  const onSubmit = async (data: BankFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nom", data.nom);
    formData.append("numeroCompte", data.numeroCompte);
    if (data.agenceBancaire) formData.append("agenceBancaire", data.agenceBancaire);
    if (data.devise) formData.append("devise", data.devise);
    if (data.objectifMensuel) formData.append("objectifMensuel", data.objectifMensuel);

    const result = await updateBankAction(bank.id, formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success("Banque modifiée avec succès.");
      router.push("/dashboard/banks");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/banks">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier la Banque</h1>
          <p className="text-sm text-muted-foreground mt-1">Mettez à jour les informations du compte.</p>
        </div>
      </div>

      <Card className="p-6 border-border/60 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Landmark size={20} />
            </div>
            <h2 className="font-semibold text-lg">Informations du compte</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom abrégé <span className="text-destructive">*</span></Label>
                <Input id="nom" placeholder="Ex: UBA Akwa" {...register("nom")} className="bg-muted/30" />
                {errors.nom && <p className="text-xs text-destructive font-medium">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroCompte">Numéro de compte <span className="text-destructive">*</span></Label>
                <Input id="numeroCompte" placeholder="Ex: 00000 0000 00" {...register("numeroCompte")} className="bg-muted/30" />
                {errors.numeroCompte && <p className="text-xs text-destructive font-medium">{errors.numeroCompte.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenceBancaire">Agence / Localisation (Optionnel)</Label>
              <Input id="agenceBancaire" placeholder="Ex: Agence Principale Akwa" {...register("agenceBancaire")} className="bg-muted/30" />
              {errors.agenceBancaire && <p className="text-xs text-destructive font-medium">{errors.agenceBancaire.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="devise">Devise (Optionnel)</Label>
                <Select defaultValue={bank.devise || "XAF"} onValueChange={(value) => value && setValue('devise', value as string)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XAF">XAF (FCFA)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.devise && <p className="text-xs text-destructive font-medium">{errors.devise.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectifMensuel">Objectif Mensuel (FCFA)</Label>
                <Input id="objectifMensuel" type="number" placeholder="Ex: 50000000" {...register("objectifMensuel")} className="bg-muted/30" />
                {errors.objectifMensuel && <p className="text-xs text-destructive font-medium">{errors.objectifMensuel.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/40 flex justify-end gap-3">
            <Link href="/dashboard/banks">
              <Button type="button" variant="outline" className="shadow-none">Annuler</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="shadow-md shadow-primary/20">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
