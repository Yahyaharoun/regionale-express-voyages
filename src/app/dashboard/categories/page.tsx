import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Tag, FolderOpen } from "lucide-react";
import Link from "next/link";
import { getCategories } from "@/actions/categoryActions";
import { EntityActionsMenu } from "@/components/EntityActionsMenu";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAgentRole } from "@/lib/netEnCaisse";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user || isAgentRole(user.role)) {
    redirect("/dashboard");
  }
  const result = await getCategories();
  const categories = result?.data || [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories de Dépenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez la classification de vos charges.</p>
        </div>
        <Link href="/dashboard/categories/new" className="w-full sm:w-auto">
          <Button className="shadow-md shadow-primary/20 w-full transition-transform active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Catégorie
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une catégorie..." 
            className="pl-9 h-10 bg-background border-border/60"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
            Aucune catégorie trouvée.
          </div>
        ) : (
          categories.map((category: any) => (
            <Card key={category.id} className="p-5 border-border/60 shadow-sm hover:border-primary/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Tag size={20} />
                    </div>
                  </div>
                  <EntityActionsMenu 
                    id={category.id} 
                    type="category" 
                    isActive={category.isActive} 
                    onEditUrl={`/dashboard/categories/${category.id}/edit`} 
                  />
                </div>
                
                <div className="mt-4">
                  <h3 className="font-bold text-base leading-tight">{category.nom}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <FolderOpen size={14} />
                    <span>Groupe: </span>
                    <span className="font-medium text-foreground">{category.groupe}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  category.isActive ? 'text-emerald-600' : 'text-destructive'
                }`}>
                  {category.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
