"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2, X, Undo2, Edit2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { bulkValidateOperationsAction, bulkDeleteOperationsAction, bulkCancelOperationsAction } from "@/actions/bulkActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  userRole: string;
  editUrlPrefix: string;
}

export function BulkActionBar({ selectedIds, onClearSelection, userRole, editUrlPrefix }: BulkActionBarProps) {
  const { confirm } = useConfirm();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      router.push(`${editUrlPrefix}/${selectedIds[0]}/edit`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 animate-in fade-in">
      <div className="flex items-center gap-2 pr-2 border-r border-border/40">
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
          {selectedIds.length}
        </span>
        <span className="text-sm font-medium text-muted-foreground hidden sm:inline">sélectionné(s)</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canValidate && (
          <>
            <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50" onClick={handleValidate} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1 sm:mr-2" />}
              <span className="text-xs sm:text-sm">Valider</span>
            </Button>
            <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 bg-destructive/5" onClick={handleReject} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-1 sm:mr-2" />}
              <span className="text-xs sm:text-sm">Rejeter</span>
            </Button>
          </>
        )}
        
        {selectedIds.length === 1 && (
          <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-600 hover:bg-blue-50 bg-blue-50/50" onClick={handleEdit} disabled={isLoading}>
            <Edit2 className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Modifier</span>
          </Button>
        )}

        {userRole !== 'AGENT' && userRole !== 'CAISSIER' && (
          <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-50 bg-orange-50/50" onClick={handleCancel} disabled={isLoading} title="Annuler (Extourner) ces opérations">
            <Undo2 className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Annuler</span>
          </Button>
        )}

        {canDelete && (
          <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/10 bg-destructive/5" onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Supprimer</span>
          </Button>
        )}
      </div>

      <div className="pl-1 sm:pl-2">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={onClearSelection} disabled={isLoading} title="Effacer la sélection">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
