"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, Power, CreditCard } from "lucide-react";
import { createFournisseurAction, updateFournisseurAction, toggleFournisseurStatusAction } from "@/actions/fournisseurActions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export function FournisseursView({ initialFournisseurs, userRole }: { initialFournisseurs: any[], userRole?: string }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const canEdit = userRole === 'PDG' || userRole === 'DG';

  const filtered = initialFournisseurs.filter(f => 
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (f.ville && f.ville.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (formData: FormData) => {
    let res;
    if (editItem) {
      res = await updateFournisseurAction(editItem.id, formData);
    } else {
      res = await createFournisseurAction(formData);
    }

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(editItem ? "Fournisseur modifié" : "Fournisseur créé");
      setIsAddOpen(false);
      setEditItem(null);
    }
  };

  const toggleStatus = async (f: any) => {
    if (!canEdit) return;
    const res = await toggleFournisseurStatusAction(f.id, f.statut);
    if (res?.error) toast.error(res.error);
    else toast.success("Statut modifié");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Fournisseurs</h2>
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) setEditItem(null); }}>
            <DialogTrigger render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Fournisseur
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input name="nom" defaultValue={editItem?.nom} required />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input name="ville" defaultValue={editItem?.ville} />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input name="adresse" defaultValue={editItem?.adresse} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input name="telephone" defaultValue={editItem?.telephone} />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Input name="categorie" defaultValue={editItem?.categorie} placeholder="ex: Carburant, Pièces..." />
                </div>
                <Button type="submit" className="w-full">Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2 bg-background p-2 rounded-lg border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Rechercher un fournisseur..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville/Adresse</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nom}</TableCell>
                <TableCell>{f.ville} {f.adresse && `- ${f.adresse}`}</TableCell>
                <TableCell>{f.telephone}</TableCell>
                <TableCell>{f.categorie}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${f.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                    {f.statut}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/expenses/new?fournisseurId=${f.id}`)} title="Nouveau paiement">
                    <CreditCard className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(f); setIsAddOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(f)}>
                        <Power className={`h-4 w-4 ${f.statut === 'ACTIF' ? 'text-destructive' : 'text-emerald-600'}`} />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun fournisseur trouvé.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
