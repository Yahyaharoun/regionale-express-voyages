"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2, X, FileEdit } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { bulkValidateOperationsAction, bulkDeleteOperationsAction, bulkCancelOperationsAction } from "@/actions/bulkActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  userRole: string;
}

export function BulkActionBar({ selectedIds, onClearSelection, userRole }: BulkActionBarProps) {
  const { confirm } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);

  const canValidate = userRole === "PDG" || userRole === "DG" || userRole === "DGA";
  const canDelete = userRole === "PDG" || userRole === "DG"; // Only PDG/DG can delete validated ops, but anyone but agents can delete pending. We rely on backend check.

  if (selectedIds.length === 0) return null;

  const handleAction = async (actionFn: (ids: string[]) => Promise<{ success?: boolean; error?: string; count?: number }>, successMsg: string, title: string, description: string) => {
    confirm({
      title,
      description,
      confirmText: "Oui, confirmer",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const res = await actionFn(selectedIds);
          if (res.success) {
            toast.success(`${res.count} ${successMsg}`);
            onClearSelection();
          } else {
            toast.error(res.error || "Une erreur est survenue.");
          }
        } catch (e: any) {
          toast.error("Erreur inattendue : " + e.message);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleValidate = () => handleAction(
    (ids) => bulkValidateOperationsAction(ids, "VALIDEE"), 
    "opérations validées", 
    "Valider la sélection", 
    `Êtes-vous sûr de vouloir valider les ${selectedIds.length} opérations sélectionnées ?`
  );

  const handleReject = () => handleAction(
    (ids) => bulkValidateOperationsAction(ids, "REJETEE"), 
    "opérations rejetées", 
    "Rejeter la sélection", 
    `Êtes-vous sûr de vouloir rejeter les ${selectedIds.length} opérations sélectionnées ?`
  );

  const handleDelete = () => handleAction(
    (ids) => bulkDeleteOperationsAction(ids), 
    "opérations supprimées", 
    "Supprimer la sélection", 
    `Attention ! Êtes-vous sûr de vouloir supprimer définitivement les ${selectedIds.length} opérations sélectionnées ? Cette action est irréversible.`
  );
  
  const handleCancel = () => handleAction(
    (ids) => bulkCancelOperationsAction(ids), 
    "opérations annulées", 
    "Annuler la sélection", 
    `Êtes-vous sûr de vouloir annuler les ${selectedIds.length} opérations sélectionnées ?`
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-3 bg-card shadow-2xl border border-border/50 rounded-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 px-3 border-r">
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
          {selectedIds.length}
        </span>
        <span className="text-sm font-semibold hidden sm:inline">sélectionné(s)</span>
      </div>

      <div className="flex items-center gap-2 px-2">
        {canValidate && (
          <>
            <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50" onClick={handleValidate} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Valider
            </Button>
            <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleReject} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Rejeter
            </Button>
          </>
        )}
        
        {userRole !== 'AGENT' && userRole !== 'CAISSIER' && (
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading}>
            <FileEdit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Annuler</span>
          </Button>
        )}

        {canDelete && (
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Supprimer</span>
          </Button>
        )}
      </div>

      <div className="pl-2 border-l">
        <Button size="icon" variant="ghost" onClick={onClearSelection} disabled={isLoading}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
