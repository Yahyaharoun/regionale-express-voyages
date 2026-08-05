import { WifiOff, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Hors Ligne - REGIONALE EXPRESS VOYAGES",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground text-center">
      <div className="w-24 h-24 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />
      </div>
      
      <h1 className="text-3xl font-bold mb-4">Mode Hors-Ligne</h1>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
        Il semble que vous ayez perdu votre connexion Internet. Pas d'inquiétude, l'application est conçue pour fonctionner de manière résiliente. 
        Vos opérations en attente seront automatiquement synchronisées dès le retour du réseau.
      </p>

      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Retour au Tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
}
