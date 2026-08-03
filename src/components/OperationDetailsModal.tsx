"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

export function OperationDetailsModal({ operation }: { operation: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="h-8 border-blue-500/20 text-blue-600 hover:bg-blue-500/10">
          <Eye className="w-4 h-4 mr-1" />
          Détails
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl border-b pb-2">Détails de l'opération</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Type</span>
            <p className="font-semibold text-slate-800">{operation.type.replace('_', ' ')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Montant (Total)</span>
            <p className="font-semibold text-slate-800 text-lg">{operation.montant.toLocaleString('fr-FR')} FCFA</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Date</span>
            <p className="font-semibold text-slate-800">
              {format(new Date(operation.dateOperation || operation.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Statut</span>
            <p className="font-semibold">
              <Badge variant={
                operation.statut === 'VALIDEE' ? 'default' : 
                operation.statut === 'REJETEE' ? 'destructive' : 
                operation.statut === 'EN_ATTENTE' ? 'secondary' : 'outline'
              }>
                {operation.statut}
              </Badge>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-sm text-slate-500">Créé par (Agent)</span>
            <p className="font-semibold text-slate-800">
              {operation.agent ? `${operation.agent.prenom} ${operation.agent.nom}` : "Inconnu"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-slate-500">Agence</span>
            <p className="font-semibold text-slate-800">
              {operation.agency?.nom || "Non spécifiée"}
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-sm text-slate-500">Motif / Commentaire</span>
            <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px]">
              {operation.commentaire || operation.reference || "Aucun commentaire"}
            </p>
          </div>
          
          {/* Détails Versements Bancaires */}
          {operation.type === 'VERSEMENT' && operation.bank && (
            <div className="space-y-1 sm:col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="text-sm text-slate-500">Banque</span>
              <p className="font-semibold text-slate-800">
                {operation.bank.nom} (Compte: {operation.bank.numeroCompte})
              </p>
            </div>
          )}
        </div>

        {/* Détails Achat Fournisseur */}
        {operation.fournisseurId && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-bold text-emerald-800 mb-3">Informations Fournisseur</h4>
            <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <div className="space-y-1">
                <span className="text-sm text-slate-500">Fournisseur</span>
                <p className="font-semibold text-slate-800">{operation.fournisseur?.nom || "Inconnu"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">Statut de Paiement</span>
                <p className="font-semibold">
                  <Badge variant="outline" className="bg-white">{operation.statutPaiement}</Badge>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">Montant Versé</span>
                <p className="font-semibold text-emerald-600">{operation.montantVerse?.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">Reste à Payer</span>
                <p className="font-semibold text-red-600">{operation.montantRestant?.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>

            {operation.lignes && operation.lignes.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-sm mb-2 text-slate-700">Articles achetés :</h5>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>P.U.</TableHead>
                        <TableHead>Qté</TableHead>
                        <TableHead className="text-right">Sous-total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operation.lignes.map((ligne: any) => (
                        <TableRow key={ligne.id}>
                          <TableCell className="font-medium">{ligne.produit}</TableCell>
                          <TableCell>{ligne.prixUnitaire.toLocaleString('fr-FR')} F</TableCell>
                          <TableCell>{ligne.quantite}</TableCell>
                          <TableCell className="text-right font-bold">{ligne.montantLigne.toLocaleString('fr-FR')} F</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Justificatifs */}
        {operation.justificatifs && operation.justificatifs.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-bold text-slate-800 mb-3">Justificatifs</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {operation.justificatifs.map((url: string, index: number) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block relative h-32 border rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-slate-100">
                  <Image src={url} alt={`Justificatif ${index + 1}`} fill className="object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
