"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateExpenseAction } from "@/actions/operationActions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, Operation } from "@prisma/client";

interface EditExpenseFormProps {
  categories: Category[];
  operation: Operation;
}

export function EditExpenseForm({ categories, operation }: EditExpenseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(operation.categoryId || "");

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await updateExpenseAction(operation.id, formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Opération modifiée avec succès !");
      router.push("/dashboard/expenses");
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="montant">Montant (FCFA) *</Label>
        <div className="relative">
          <Input 
            id="montant" 
            name="montant" 
            type="number" 
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="ex: 15000" 
            defaultValue={operation.montant}
            required 
            className="pl-4 h-12 text-lg font-semibold bg-muted/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            FCFA
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Catégorie de la dépense *</Label>
        <input type="hidden" name="categoryId" value={selectedCategoryId} />
        <Select name="categoryId" required value={selectedCategoryId || undefined} onValueChange={(val) => setSelectedCategoryId(val as string)}>
          <SelectTrigger className="h-11 bg-muted/30">
            {selectedCategory ? (
              <span className="truncate">{selectedCategory.nom}</span>
            ) : (
              <SelectValue placeholder="Sélectionner une catégorie" />
            )}
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commentaire">Motif / Commentaire *</Label>
        <Input 
          id="commentaire" 
          name="commentaire" 
          defaultValue={operation.commentaire || ""}
          placeholder="ex: Achat de rames de papier pour l'agence" 
          required 
          className="h-11 bg-muted/30"
        />
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border/40">
        <Button 
          type="button" 
          variant="outline" 
          className="h-11 sm:w-1/3"
          onClick={() => router.push("/dashboard/expenses")}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="h-11 sm:w-2/3 shadow-md shadow-primary/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Modification...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </div>
    </form>
  );
}
