"use client";

import { useState } from "react";
import { MoreVertical, Edit2, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toggleCategoryStatusAction, deleteCategoryAction } from "@/actions/categoryActions";
import { toggleBankStatusAction, deleteBankAction } from "@/actions/bankActions";
import { toggleAgencyStatusAction, deleteAgencyAction } from "@/actions/agencyActions";
import { toggleUserStatus, deleteUserAction } from "@/app/dashboard/settings/users/actions";

interface EntityActionsMenuProps {
  id: string;
  type: "category" | "bank" | "agency" | "user";
  isActive: boolean;
  onEditUrl: string;
}

export function EntityActionsMenu({ id, type, isActive, onEditUrl }: EntityActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    let result: any = { success: false, error: "" };
    
    try {
      if (type === "category") {
        result = await toggleCategoryStatusAction(id, isActive);
      } else if (type === "bank") {
        result = await toggleBankStatusAction(id, isActive);
      } else if (type === "agency") {
        result = await toggleAgencyStatusAction(id, isActive);
      } else if (type === "user") {
        result = await toggleUserStatus(id, isActive);
      }

      if (result.success) {
        toast.success(isActive ? "Suspendu avec succès" : "Réactivé avec succès");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la modification");
      }
    } catch (error) {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;
    
    setIsLoading(true);
    let result: any = { success: false, error: "" };
    
    try {
      if (type === "category") {
        result = await deleteCategoryAction(id);
      } else if (type === "bank") {
        result = await deleteBankAction(id);
      } else if (type === "agency") {
        result = await deleteAgencyAction(id);
      } else if (type === "user") {
        result = await deleteUserAction(id);
      }

      if (result.success) {
        toast.success("Supprimé avec succès");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" aria-label="Options" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreVertical size={16} />
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push(onEditUrl)} className="cursor-pointer">
          <Edit2 className="w-4 h-4 mr-2 text-blue-500" />
          <span>Modifier</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleToggle} 
          disabled={isLoading} 
          className="cursor-pointer"
        >
          {isActive ? (
            <>
              <PowerOff className="w-4 h-4 mr-2 text-destructive" />
              <span className="text-destructive">Suspendre</span>
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2 text-emerald-500" />
              <span className="text-emerald-500">Réactiver</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete} 
          disabled={isLoading} 
          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span>Supprimer</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
