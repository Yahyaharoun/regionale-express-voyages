import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Filter, Plus, Clock, CheckCircle2, XCircle, FileEdit, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Operation, Category } from "@prisma/client";
import { getOperations } from "@/actions/operationActions";
import { ApprovalButtons } from "@/features/expenses/ApprovalButtons";
import { ExportMenu } from "@/features/expenses/ExportMenu";
import { DateFilterDropdown } from "@/features/expenses/DateFilterDropdown";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OperationActionsMenu } from "@/components/OperationActionsMenu";
import { OperationDetailsModal } from "@/components/OperationDetailsModal";

export default async function ExpensesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const range = (searchParams?.range as string) || "month";
  const user = await getCurrentUser();
  let role = "CAISSIER";
  
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { role: true } });
    if (dbUser) role = dbUser.role;
  }

  const result = await getOperations(0, 50, range);
  const operations = result?.data || [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dépenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos dépenses.</p>
        </div>
        <Link href="/dashboard/expenses/new" className="w-full sm:w-auto">
          <Button size="sm" className="shadow-[0_2px_10px_rgba(0,0,0,0.08)] w-full transition-all duration-200 active:scale-95">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouvelle Dépense
          </Button>
        </Link>
      </div>

      {/* Filters Mobile-First */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une opération..." 
            className="pl-9 h-9 bg-background border-border/40 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-200 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <ExportMenu />
          <Button variant="outline" size="sm" className="h-9 px-3 bg-background flex-1 sm:flex-none border-border/40 shadow-none hover:bg-muted/30 hidden">
            <Filter className="h-3.5 w-3.5 mr-2" />
            Filtrer
          </Button>
          <DateFilterDropdown />
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {operations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
            Aucune opération trouvée.
          </div>
        ) : (
          operations.map((op: any) => (
            <Card key={op.id} className="p-4 border-border/40 shadow-none bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 sm:mt-0 ${
                  op.statut === 'EN_ATTENTE' ? 'bg-amber-500/10 text-amber-500' :
                  op.statut === 'VALIDEE' ? 'bg-emerald-500/10 text-emerald-500' :
                  op.statut === 'REJETEE' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {op.statut === 'EN_ATTENTE' && <><div className="absolute w-2 h-2 rounded-full bg-amber-500 animate-pulse -top-0.5 -right-0.5 border border-background"></div><Clock size={14} /></>}
                  {op.statut === 'VALIDEE' && <CheckCircle2 size={14} />}
                  {op.statut === 'REJETEE' && <XCircle size={14} />}
                  {op.statut === 'BROUILLON' && <FileEdit size={14} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm leading-none">{op.commentaire || 'Opération sans motif'}</h3>
                    <span className={`inline-flex sm:hidden items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      op.statut === 'EN_ATTENTE' ? 'text-amber-500' :
                      op.statut === 'VALIDEE' ? 'text-emerald-500' :
                      op.statut === 'REJETEE' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {op.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-1.5">{op.category?.nom || op.type} • {new Date(op.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              
              <div className="flex items-end justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20">
                <div className="text-right">
                  <p className={`text-base font-bold leading-none ${op.type === 'DEPENSE' ? 'text-foreground' : 'text-emerald-500'}`}>
                    {op.type === 'DEPENSE' ? '-' : '+'}{op.montant.toLocaleString('fr-FR')} <span className="text-xs font-medium text-muted-foreground">FCFA</span>
                  </p>
                  <span className={`hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-widest mt-1.5 ${
                      op.statut === 'EN_ATTENTE' ? 'text-amber-500' :
                      op.statut === 'VALIDEE' ? 'text-emerald-500' :
                      op.statut === 'REJETEE' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                    {op.statut.replace('_', ' ')}
                  </span>
                </div>
                
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
                      onEditUrl={op.type === 'DEPENSE' ? `/dashboard/expenses/${op.id}/edit` : `/dashboard/deposits/${op.id}/edit`} 
                      userRole={role}
                      canValidate={role === "DG" || role === "PDG" || role === "DGA"}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
