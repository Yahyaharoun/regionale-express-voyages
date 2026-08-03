"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";

export function LogoutButton() {
  const router = useRouter();
  const { confirm } = useConfirm();

  const doLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Déconnexion réussie.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la déconnexion.");
    }
  };

  const handleLogout = () => {
    confirm({
      title: "Déconnexion",
      description: "Êtes-vous sûr de vouloir vous déconnecter ?",
      confirmText: "Me déconnecter",
      variant: "destructive",
      onConfirm: doLogout,
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-medium text-sm transition-all duration-200"
      aria-label="Se déconnecter"
    >
      <LogOut size={16} />
      Déconnexion
    </button>
  );
}
