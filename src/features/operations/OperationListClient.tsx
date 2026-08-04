"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, FileEdit, Clock, ChevronRight } from "lucide-react";
import { OperationDetailsModal } from "@/components/OperationDetailsModal";
import { ApprovalButtons } from "@/features/expenses/ApprovalButtons";
import { OperationActionsMenu } from "@/components/OperationActionsMenu";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Checkbox } from "@/components/ui/checkbox";

interface OperationListClientProps {
  operations: any[];
  role: string;
  editUrlPrefix: string;
}

export function OperationListClient({ operations, role, editUrlPrefix }: OperationListClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(operations.map(op => op.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const canValidate = role === "DG" || role === "PDG" || role === "DGA";

  if (operations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
        Aucune opération trouvée.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center px-4 py-2">
        <Checkbox 
          checked={selectedIds.length === operations.length && operations.length > 0} 
          onCheckedChange={handleSelectAll} 
          aria-label="Tout sélectionner"
          className="mr-3 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <span className="text-sm text-muted-foreground font-medium">Tout sélectionner</span>
      </div>

      {operations.map((op: any) => (
        <Card key={op.id} className={`p-4 shadow-none bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 group relative ${selectedIds.includes(op.id) ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border/40 hover:border-border/80'}`}>
          <div className="flex items-start gap-4">
            <div className="pt-1">
              <Checkbox 
                checked={selectedIds.includes(op.id)} 
                onCheckedChange={(checked: boolean) => handleSelectOne(op.id, checked)} 
                className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>

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
              <p className="text-xs text-muted-foreground font-medium mt-1.5">{op.category?.nom || op.type} • {new Date(op.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </div>
          </div>
          
          <div className="flex items-end justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/20 pl-7 sm:pl-0">
            <div className="text-right">
              <p className={`text-base font-bold leading-none ${op.type === 'DEPENSE' || op.type === 'DEPENSE_FOURNISSEUR' ? 'text-foreground' : 'text-emerald-500'}`}>
                {op.type === 'DEPENSE' || op.type === 'DEPENSE_FOURNISSEUR' ? '-' : '+'}{op.montant.toLocaleString('fr-FR')} <span className="text-xs font-medium text-muted-foreground">FCFA</span>
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
              <div className="flex gap-2 items-center relative z-10">
                <OperationDetailsModal operation={op} />
                <ApprovalButtons operationId={op.id} />
              </div>
            ) : (
              <div className="flex gap-2 items-center relative z-10">
                <OperationDetailsModal operation={op} />
                <OperationActionsMenu 
                  id={op.id} 
                  type={op.type} 
                  statut={op.statut} 
                  onEditUrl={`${editUrlPrefix}/${op.id}/edit`} 
                  userRole={role}
                  canValidate={canValidate}
                />
              </div>
            )}
          </div>
        </Card>
      ))}

      <BulkActionBar 
        selectedIds={selectedIds} 
        onClearSelection={() => setSelectedIds([])} 
        userRole={role} 
      />
    </div>
  );
}
