"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDepositAction } from "@/actions/operationActions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bank, Operation } from "@prisma/client";

interface EditDepositFormProps {
  banks: Bank[];
  operation: Operation;
}

export function EditDepositForm({ banks, operation }: EditDepositFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>(operation.bankId || "");
  const isSubmitting = useRef(false);

  const selectedBank = banks.find(b => b.id === selectedBankId);

  async function onSubmit(formData: FormData) {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateDepositAction(operation.id, formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Versement modifié avec succès !");
        router.push("/dashboard/deposits");
        return;
      }
    } catch (err: any) {
      const msg = err?.message || "Une erreur inattendue s'est produite.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
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
        <Label htmlFor="montant">Montant déposé (FCFA) *</Label>
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

      <div className="space-y-2">
        <Label htmlFor="bankId">Banque de dépôt *</Label>
        <input type="hidden" name="bankId" value={selectedBankId} />
        <Select name="bankId" required value={selectedBankId || undefined} onValueChange={(val) => setSelectedBankId(val as string)}>
          <SelectTrigger className="h-11 bg-muted/30">
            {selectedBank ? (
              <span className="truncate">{`${selectedBank.nom} (${selectedBank.numeroCompte})`}</span>
            ) : (
              <SelectValue placeholder="Sélectionner une banque" />
            )}
          </SelectTrigger>
          <SelectContent>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                {`${bank.nom} (${bank.numeroCompte})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Référence du bordereau *</Label>
        <Input 
          id="reference" 
          name="reference" 
          defaultValue={operation.reference || ""}
          placeholder="ex: BORD-2023-001" 
          required 
          className="h-11 bg-muted/30 uppercase"
        />
        <p className="text-xs text-muted-foreground">Saisissez le numéro figurant sur le reçu bancaire.</p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border/40">
        <Button 
          type="button" 
          variant="outline" 
          className="h-11 sm:w-1/3"
          onClick={() => router.push("/dashboard/deposits")}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="h-11 sm:w-2/3 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
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
