import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Clock, CheckCircle2, Plus } from "lucide-react";
import { getOperations } from "@/actions/operationActions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OperationActionsMenu } from "@/components/OperationActionsMenu";
import { OperationDetailsModal } from "@/components/OperationDetailsModal";
import { OperationListClient } from "@/features/operations/OperationListClient";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { SyntheseJournaliere } from "@/features/recettes/SyntheseJournaliere";

export default async function DepositsPage() {
  const result = await getOperations(0, 50);
  const user = await getCurrentUser();
  const role = user?.role || "CAISSIER";
  const canValidate = role === "DG" || role === "PDG" || role === "DGA";
  const operations = result?.data ?? [];
  const recettes = operations.filter((op) => op.type === "RECETTE");

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recettes journalières</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Historique des recettes journalières de votre agence.
          </p>
        </div>
        <Link href="/dashboard/recettes/new" className="w-full sm:w-auto">
          <Button size="sm" className="shadow-[0_2px_10px_rgba(0,0,0,0.08)] w-full transition-all duration-200 active:scale-95">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouvelle Recette journalière
          </Button>
        </Link>
      </div>

      <SyntheseJournaliere />

      <OperationListClient 
        operations={recettes} 
        role={role} 
        editUrlPrefix="/dashboard/recettes" 
      />
    </div>
  );
}
