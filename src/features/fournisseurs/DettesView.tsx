"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Search, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { reglerDetteAction } from "@/actions/detteActions";
import { Textarea } from "@/components/ui/textarea";

export function DettesView({ dettes }: { dettes: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDette, setSelectedDette] = useState<any>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = dettes.filter(d => 
    d.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePay = async (formData: FormData) => {
    if (!selectedDette) return;
    setIsLoading(true);
    const montant = parseInt(formData.get("montant") as string, 10);
    const observation = formData.get("observation") as string;

    const res = await reglerDetteAction(selectedDette.id, montant, observation);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Règlement effectué avec succès");
      setIsPayOpen(false);
      setSelectedDette(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Dettes Fournisseurs</h2>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <Input 
          placeholder="Rechercher un fournisseur..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 text-base"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Fournisseur</TableHead>
                <TableHead className="font-semibold text-slate-700">Total Achats</TableHead>
                <TableHead className="font-semibold text-slate-700">Total Payé</TableHead>
                <TableHead className="font-semibold text-slate-700">Reste à Payer</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                    Aucune dette trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((dette) => (
                  <TableRow key={dette.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-bold text-slate-800">{dette.nom}</div>
                      <div className="text-sm text-slate-500">{dette.nombreFactures} opération(s)</div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{dette.totalAchats.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell className="font-medium text-emerald-600">{dette.totalPaye.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell className="font-bold text-red-600">{dette.resteAPayer.toLocaleString('fr-FR')} FCFA</TableCell>
                    <TableCell className="text-right">
                      {dette.resteAPayer > 0 && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => { setSelectedDette(dette); setIsPayOpen(true); }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Régler
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isPayOpen} onOpenChange={(open) => { setIsPayOpen(open); if(!open) setSelectedDette(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Régler une dette : {selectedDette?.nom}</DialogTitle>
            <DialogDescription>Reste à payer total : <strong className="text-red-500">{selectedDette?.resteAPayer.toLocaleString('fr-FR')} FCFA</strong></DialogDescription>
          </DialogHeader>
          <form action={handlePay} className="space-y-4">
            <div className="space-y-2">
              <Label>Montant à régler (FCFA)</Label>
              <Input type="number" name="montant" required max={selectedDette?.resteAPayer} placeholder="Ex: 50000" />
            </div>
            <div className="space-y-2">
              <Label>Observation / Commentaire (Optionnel)</Label>
              <Textarea name="observation" placeholder="Ex: Chèque n°12345" />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {isLoading ? "Traitement..." : "Confirmer le paiement"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
