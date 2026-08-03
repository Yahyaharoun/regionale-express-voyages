"use client";

import { useState } from "react";
import { MoreVertical, Edit2, XCircle, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteOperationAction, cancelOperationAction, validateOperationAction } from "@/actions/operationActions";
import { playValidationSound, playErrorSound, playNotificationSound } from "@/lib/notification-sounds";
import { useConfirm } from "@/hooks/useConfirm";

interface OperationActionsMenuProps {
  id: string;
  type: "DEPENSE" | "VERSEMENT" | "RECETTE" | string;
  statut: "BROUILLON" | "EN_ATTENTE" | "VALIDEE_DG" | "VALIDEE" | "REJETEE" | "ANNULEE";
  onEditUrl: string;
  userRole?: string;
  canValidate?: boolean;
}

export function OperationActionsMenu({ id, type, statut, onEditUrl, userRole, canValidate = false }: OperationActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { confirm } = useConfirm();

  // Déterminer si l'utilisateur est un Agent de saisie (pas de modification/suppression/validation)
  const AGENT_ROLES = ["AGENT", "CAISSIER", "DGA", "CHEF_AGENCE", "COMPTABLE", "SECRETAIRE", "AUTRE"];
  const isAgent = userRole ? AGENT_ROLES.includes(userRole) : false;

  const isSuperUser = userRole === "PDG" || userRole === "DG";
  const canEdit = !isAgent && (statut === "BROUILLON" || statut === "EN_ATTENTE" || isSuperUser);
  const isLocked = isAgent || ((statut === "VALIDEE" || statut === "VALIDEE_DG" || statut === "ANNULEE") && !isSuperUser);
  const canActuallyValidate = canValidate && !isAgent;

  const doCancel = async () => {
    setIsLoading(true);
    try {
      const result = await cancelOperationAction(id);
      if (result.success) {
        toast.success("Opération annulée avec succès");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'annulation");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    confirm({
      title: "Annuler l'opération",
      description: "Êtes-vous sûr de vouloir annuler cette opération ? Elle sera marquée comme ANNULEE.",
      confirmText: "Oui, Annuler",
      variant: "destructive",
      onConfirm: doCancel
    });
  };

  const doValidate = async () => {
    setIsLoading(true);
    try {
      const result = await validateOperationAction(id, "VALIDEE");
      if (result.success) {
        await playValidationSound();
        toast.success("Opération validée avec succès ✓");
        router.refresh();
      } else {
        await playErrorSound();
        toast.error(result.error || "Erreur lors de la validation");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = () => {
    confirm({
      title: "Valider l'opération",
      description: "Êtes-vous sûr de vouloir valider cette opération ?",
      confirmText: "Oui, Valider",
      variant: "default",
      onConfirm: doValidate
    });
  };

  const doReject = async () => {
    setIsLoading(true);
    try {
      const result = await validateOperationAction(id, "REJETEE");
      if (result.success) {
        toast.success("Opération rejetée avec succès");
        router.refresh();
      } else {
        await playErrorSound();
        toast.error(result.error || "Erreur lors du rejet");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    confirm({
      title: "Rejeter l'opération",
      description: "Êtes-vous sûr de vouloir rejeter cette opération ?",
      confirmText: "Oui, Rejeter",
      variant: "destructive",
      onConfirm: doReject
    });
  };

  const doDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteOperationAction(id);
      if (result.success) {
        toast.success("Supprimé avec succès");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Supprimer l'opération",
      description: "Êtes-vous sûr de vouloir supprimer définitivement cette opération ?",
      confirmText: "Oui, Supprimer",
      variant: "destructive",
      onConfirm: doDelete
    });
  };

  // Si l'utilisateur est un Agent de saisie, on masque le menu d'actions
  if (isAgent) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" aria-label="Plus d'options" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreVertical size={16} />
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-52">
        {canEdit && (
          <DropdownMenuItem onClick={() => router.push(onEditUrl)} className="cursor-pointer">
            <Edit2 className="w-4 h-4 mr-2 text-blue-500" />
            <span>Modifier</span>
          </DropdownMenuItem>
        )}

        {(statut === "EN_ATTENTE" || statut === "BROUILLON") && canActuallyValidate && (
          <>
            <DropdownMenuItem
              onClick={handleValidate}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Valider</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleReject}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              <span className="text-red-600 font-medium">Rejeter</span>
            </DropdownMenuItem>
          </>
        )}

        {statut === "VALIDEE" && canActuallyValidate && (
          <DropdownMenuItem
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <XCircle className="w-4 h-4 mr-2 text-orange-500" />
            <span className="text-orange-500">Annuler (Extourner)</span>
          </DropdownMenuItem>
        )}

        {!isLocked && (
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isLoading}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Supprimer</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

