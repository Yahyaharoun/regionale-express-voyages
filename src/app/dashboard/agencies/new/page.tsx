"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Building, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createAgencyAction, getPotentialManagers } from "@/actions/agencyActions";
import { agencySchema } from "@/lib/validations/agency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AgencyFormValues = z.infer<typeof agencySchema>;

export default function NewAgencyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AgencyFormValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: {}
  });

  const [managers, setManagers] = useState<any[]>([]);
  useEffect(() => {
    getPotentialManagers().then(res => {
      if (res.success && res.data) {
        setManagers(res.data);
      }
    });
  }, []);

  const onSubmit = async (data: AgencyFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nom", data.nom);
    formData.append("ville", data.ville);
    if (data.adresse) formData.append("adresse", data.adresse);
    if (data.telephone) formData.append("telephone", data.telephone);
    if (data.responsable) formData.append("responsable", data.responsable);

    const result = await createAgencyAction(formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success("Agence créée avec succès.");
      router.push("/dashboard/agencies");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agencies">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle Agence</h1>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez une agence à votre réseau.</p>
        </div>
      </div>

      <Card className="p-6 border-border/60 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building size={20} />
            </div>
            <h2 className="font-semibold text-lg">Informations de l'agence</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l'agence <span className="text-destructive">*</span></Label>
                <Input id="nom" placeholder="Ex: Agence Akwa" {...register("nom")} className="bg-muted/30" />
                {errors.nom && <p className="text-xs text-destructive font-medium">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville <span className="text-destructive">*</span></Label>
                <Input id="ville" placeholder="Ex: Douala" {...register("ville")} className="bg-muted/30" />
                {errors.ville && <p className="text-xs text-destructive font-medium">{errors.ville.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse (Optionnel)</Label>
              <Input id="adresse" placeholder="Ex: Boulevard de la Liberté" {...register("adresse")} className="bg-muted/30" />
              {errors.adresse && <p className="text-xs text-destructive font-medium">{errors.adresse.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone (Optionnel)</Label>
                <Input id="telephone" placeholder="Ex: 690000000" {...register("telephone")} className="bg-muted/30" />
                {errors.telephone && <p className="text-xs text-destructive font-medium">{errors.telephone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable (Optionnel)</Label>
                <Select onValueChange={(value) => value && setValue('responsable', value as string)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Sélectionner un responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={`${m.prenom} ${m.nom}`}>
                        {m.prenom} {m.nom} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.responsable && <p className="text-xs text-destructive font-medium">{errors.responsable.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/40 flex justify-end gap-3">
            <Link href="/dashboard/agencies">
              <Button type="button" variant="outline" className="shadow-none">Annuler</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="shadow-md shadow-primary/20">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Enregistrement..." : "Enregistrer l'agence"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
