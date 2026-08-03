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
import { ArrowLeft, Tag, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateCategoryAction } from "@/actions/categoryActions";
import { categorySchema } from "@/lib/validations/category";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CategoryFormValues = z.infer<typeof categorySchema>;

export function EditCategoryForm({ category }: { category: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nom: category.nom,
      groupe: category.groupe,
      description: category.description || undefined,
    }
  });

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nom", data.nom);
    formData.append("groupe", data.groupe);
    if (data.description) formData.append("description", data.description);

    const result = await updateCategoryAction(category.id, formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else {
      toast.success("Catégorie modifiée avec succès.");
      router.push("/dashboard/categories");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/categories">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier la Catégorie</h1>
          <p className="text-sm text-muted-foreground mt-1">Mettez à jour les informations de la catégorie.</p>
        </div>
      </div>

      <Card className="p-6 border-border/60 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Tag size={20} />
            </div>
            <h2 className="font-semibold text-lg">Informations de la catégorie</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la catégorie <span className="text-destructive">*</span></Label>
                <Input id="nom" placeholder="Ex: Salaire Employé" {...register("nom")} className="bg-muted/30" />
                {errors.nom && <p className="text-xs text-destructive font-medium">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupe">Groupe comptable <span className="text-destructive">*</span></Label>
                <Select defaultValue={category.groupe} onValueChange={(value) => value && setValue('groupe', value as string)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Sélectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEPENSES_OPERATIONNELLES">Dépenses Opérationnelles</SelectItem>
                    <SelectItem value="CHARGES_SALARIALES">Charges Salariales</SelectItem>
                    <SelectItem value="IMPOTS_TAXES">Impôts & Taxes</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="AUTRES">Autres</SelectItem>
                  </SelectContent>
                </Select>
                {errors.groupe && <p className="text-xs text-destructive font-medium">{errors.groupe.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optionnel)</Label>
              <Textarea 
                id="description" 
                placeholder="Brève description de la nature de cette catégorie..." 
                {...register("description")} 
                className="bg-muted/30 resize-none h-24" 
              />
              {errors.description && <p className="text-xs text-destructive font-medium">{errors.description.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-border/40 flex justify-end gap-3">
            <Link href="/dashboard/categories">
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
