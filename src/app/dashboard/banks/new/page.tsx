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
import { createBankAction } from "@/actions/bankActions";
import { bankSchema } from "@/lib/validations/bank";

type BankFormValues = z.infer<typeof bankSchema>;

export default function NewBankPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      devise: "XAF",
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

    const result = await createBankAction(formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success("Banque créée avec succès.");
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
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle Banque</h1>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez un nouveau compte bancaire d'entreprise.</p>
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
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la banque <span className="text-destructive">*</span></Label>
              <Input id="nom" placeholder="Ex: Ecobank, UBA, etc." {...register("nom")} className="bg-muted/30" />
              {errors.nom && <p className="text-xs text-destructive font-medium">{errors.nom.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroCompte">Numéro de compte <span className="text-destructive">*</span></Label>
              <Input id="numeroCompte" placeholder="Ex: 012345678901" {...register("numeroCompte")} className="bg-muted/30" />
              {errors.numeroCompte && <p className="text-xs text-destructive font-medium">{errors.numeroCompte.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenceBancaire">Agence bancaire (Optionnel)</Label>
              <Input id="agenceBancaire" placeholder="Ex: Agence Principale Akwa" {...register("agenceBancaire")} className="bg-muted/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objectifMensuel">Objectif mensuel (FCFA) (Optionnel)</Label>
                <Input id="objectifMensuel" type="number" placeholder="Ex: 5000000" {...register("objectifMensuel")} className="bg-muted/30" />
                {errors.objectifMensuel && <p className="text-xs text-destructive font-medium">{errors.objectifMensuel.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="devise">Devise</Label>
                <Input id="devise" {...register("devise")} readOnly className="bg-muted/50 text-muted-foreground font-medium cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/40 flex justify-end gap-3">
            <Link href="/dashboard/banks">
              <Button type="button" variant="outline" className="shadow-none">Annuler</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="shadow-md shadow-primary/20">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Enregistrement..." : "Enregistrer la banque"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
