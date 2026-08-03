"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { validateOperationAction } from "@/actions/operationActions";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";

export function ApprovalButtons({ operationId }: { operationId: string }) {
  const [isLoading, setIsLoading] = useState<"VALIDEE" | "REJETEE" | null>(null);
  const { confirm } = useConfirm();

  const doAction = async (statut: "VALIDEE" | "REJETEE") => {
    setIsLoading(statut);
    const result = await validateOperationAction(operationId, statut);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Opération ${statut.toLowerCase()} avec succès.`);
    }
    setIsLoading(null);
  };

  const handleAction = (statut: "VALIDEE" | "REJETEE") => {
    if (statut === "VALIDEE") {
      confirm({
        title: "Valider l'opération",
        description: "Confirmez-vous la validation définitive de cette opération ?",
        confirmText: "Oui, Valider",
        variant: "default",
        onConfirm: () => doAction("VALIDEE")
      });
    } else {
      confirm({
        title: "Rejeter l'opération",
        description: "Êtes-vous sûr de vouloir rejeter cette opération ?",
        confirmText: "Oui, Rejeter",
        variant: "destructive",
        onConfirm: () => doAction("REJETEE")
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
        disabled={!!isLoading}
        onClick={() => handleAction("VALIDEE")}
      >
        {isLoading === "VALIDEE" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
        Valider
      </Button>
      <Button 
        size="sm" 
        variant="outline"
        className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
        disabled={!!isLoading}
        onClick={() => handleAction("REJETEE")}
      >
        {isLoading === "REJETEE" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
        Rejeter
      </Button>
    </div>
  );
}
