"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { revalidateOperationsTag } from "@/actions/cacheActions";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await revalidateOperationsTag();
      startTransition(() => {
        router.refresh();
      });
      toast.success("Données actualisées");
    } catch (e) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={handleRefresh} 
      disabled={isPending || isRefreshing}
      className="bg-background/50 border-border/40 hover:bg-muted/50 transition-all duration-300 ml-2"
      title="Actualiser les données"
    >
      <RefreshCw size={16} className={`${isPending || isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
    </Button>
  );
}
