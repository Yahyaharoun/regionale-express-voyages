import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Clock, CheckCircle2, Plus } from "lucide-react";
import { getOperations } from "@/actions/operationActions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OperationActionsMenu } from "@/components/OperationActionsMenu";
import { OperationDetailsModal } from "@/components/OperationDetailsModal";
import { ApprovalButtons } from "@/features/expenses/ApprovalButtons";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

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

      <Card className="border border-border/40 shadow-none bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ArrowRightLeft size={14} className="rotate-90 text-primary" />
            Recettes journalières récentes
          </CardTitle>
          <CardDescription>{recettes.length} recette(s) trouvée(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recettes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucune recette journalière enregistrée pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {recettes.map((op) => (
                <div key={op.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                      op.statut === "VALIDEE" ? "bg-emerald-500/10 text-emerald-500" :
                      op.statut === "VALIDEE_DG" ? "bg-blue-500/10 text-blue-500" :
                      op.statut === "EN_ATTENTE" ? "bg-amber-500/10 text-amber-500" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {op.statut === "VALIDEE" || op.statut === "VALIDEE_DG" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{op.commentaire || "Recette"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(op.createdAt).toLocaleDateString("fr-FR")} • {op.statut}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={cn("text-sm font-bold",
                      op.statut === "VALIDEE" ? "text-emerald-500" :
                      op.statut === "VALIDEE_DG" ? "text-blue-500" :
                      "text-foreground"
                    )}>
                      +{op.montant.toLocaleString("fr-FR")} FCFA
                    </p>
                    {op.statut === 'EN_ATTENTE' && (role === 'PDG' || role === 'DG') ? (
                      <div className="flex gap-2 items-center">
                        <OperationDetailsModal operation={op} />
                        <ApprovalButtons operationId={op.id} />
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <OperationDetailsModal operation={op} />
                        <OperationActionsMenu 
                          id={op.id} 
                          type={op.type} 
                          statut={op.statut} 
                          onEditUrl={`/dashboard/recettes/${op.id}/edit`} 
                          userRole={role}
                          canValidate={canValidate}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
