import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Landmark, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";
import { getBanks } from "@/actions/bankActions";
import { EntityActionsMenu } from "@/components/EntityActionsMenu";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAgentRole } from "@/lib/netEnCaisse";

export default async function BanksPage() {
  const user = await getCurrentUser();
  if (!user || isAgentRole(user.role)) {
    redirect("/dashboard");
  }
  const result = await getBanks();
  const banks = result?.data || [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banques</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les comptes bancaires et objectifs.</p>
        </div>
        <Link href="/dashboard/banks/new" className="w-full sm:w-auto">
          <Button className="shadow-md shadow-primary/20 w-full transition-transform active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Banque
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une banque..." 
            className="pl-9 h-10 bg-background border-border/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
            Aucune banque trouvée.
          </div>
        ) : (
          banks.map((bank: any) => (
            <Card key={bank.id} className="p-5 border-border/60 shadow-sm hover:border-primary/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Landmark size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{bank.nom}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                        <MapPin size={14} className="mr-1" />
                        {bank.agenceBancaire || 'Agence principale'}
                      </div>
                    </div>
                  </div>
                  <EntityActionsMenu 
                    id={bank.id} 
                    type="bank" 
                    isActive={bank.isActive} 
                    onEditUrl={`/dashboard/banks/${bank.id}/edit`} 
                  />
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard size={14} className="text-muted-foreground" />
                    <span className="font-medium tracking-wide">{bank.numeroCompte}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Devise:</span>
                    <span className="font-semibold">{bank.devise}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  Géré par REGIONALE EXPRESS VOYAGES SARL
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  bank.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                }`}>
                  {bank.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
