"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRecetteAction } from "@/actions/operationActions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Agency, Operation } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface EditRecetteFormProps {
  agencys?: any[];
  operation: Operation;
}

export function EditRecetteForm({ agencys = [], operation }: EditRecetteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(operation.agencyId || "");

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    if (selectedAgencyId) {
      formData.append("agencyId", selectedAgencyId);
    }

    const result = await updateRecetteAction(operation.id, formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Recette modifiée avec succès !");
      router.push("/dashboard/recettes");
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
            placeholder="ex: 150000" 
            defaultValue={operation.montant}
            required 
            className="pl-4 h-12 text-lg font-semibold bg-emerald-500/5 border-emerald-500/20 focus-visible:ring-emerald-500/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
            FCFA
          </div>
        </div>
      </div>

      {agencys && agencys.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="agencyId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Agence concernée</Label>
          <Select required name="agencyId" value={selectedAgencyId || undefined} onValueChange={(val) => setSelectedAgencyId(val as string)}>
            <SelectTrigger className="h-11 bg-muted/30">
              {selectedAgencyId ? (
                <span className="truncate">{agencys?.find(a => a.id === selectedAgencyId)?.nom}</span>
              ) : (
                <SelectValue placeholder="Sélectionner une agence" />
              )}
            </SelectTrigger>
            <SelectContent>
              {agencys.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="commentaire">Commentaire (Optionnel)</Label>
        <Input 
          id="commentaire" 
          name="commentaire" 
          defaultValue={operation.commentaire || ""}
          placeholder="ex: Recette journalière..." 
          className="h-11 bg-muted/30"
        />
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border/40">
        <Button 
          type="button" 
          variant="outline" 
          className="h-11 sm:w-1/3"
          onClick={() => router.push("/dashboard/recettes")}
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
