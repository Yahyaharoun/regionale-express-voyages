import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Building, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { Agency } from "@prisma/client";
import { getAgencies } from "@/actions/agencyActions";
import { EntityActionsMenu } from "@/components/EntityActionsMenu";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAgentRole } from "@/lib/netEnCaisse";

export default async function AgenciesPage() {
  const user = await getCurrentUser();
  if (!user || isAgentRole(user.role)) {
    redirect("/dashboard");
  }
  const result = await getAgencies();
  const agencies = result?.data || [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agences</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez le réseau des agences REGIONALE EXPRESS VOYAGES SARL.</p>
        </div>
        <Link href="/dashboard/agencies/new" className="w-full sm:w-auto">
          <Button className="shadow-md shadow-primary/20 w-full transition-transform active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Agence
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une agence..." 
            className="pl-9 h-10 bg-background border-border/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agencies.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
            Aucune agence trouvée.
          </div>
        ) : (
          agencies.map((agency: any) => (
            <Card key={agency.id} className="p-5 border-border/60 shadow-sm hover:border-primary/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Building size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{agency.nom}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                        <MapPin size={14} className="mr-1" />
                        {agency.ville}
                      </div>
                    </div>
                  </div>
                  <EntityActionsMenu 
                    id={agency.id} 
                    type="agency" 
                    isActive={agency.isActive} 
                    onEditUrl={`/dashboard/agencies/${agency.id}/edit`} 
                  />
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Responsable:</span>
                    <span className="font-medium">{agency.responsable || 'Non assigné'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Téléphone:</span>
                    <span className="font-medium">{agency.telephone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users size={16} className="text-muted-foreground" />
                  {agency._count?.users || 0} Agent(s)
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  agency.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                }`}>
                  {agency.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
