"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { ImageUploadPicker } from "@/components/ImageUploadPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpenseAction } from "@/actions/operationActions";
import { Loader2, UploadCloud, Camera, Image as ImageIcon, FileCheck2, PlusCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@prisma/client";

interface ExpenseFormProps {
  categories: Category[];
  fournisseurs?: any[];
  agencies?: any[];
  defaultFournisseurId?: string;
}

export function ExpenseForm({ categories, fournisseurs = [], agencies = [], defaultFournisseurId }: ExpenseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>(defaultFournisseurId || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Fournisseur Mode State
  const isSupplierMode = !!selectedFournisseurId && selectedFournisseurId !== "none";
  const [lignes, setLignes] = useState([{ produit: "", prixUnitaire: 0, quantite: 1 }]);
  const [statutPaiement, setStatutPaiement] = useState("PAYE");
  const [montantVerseCustom, setMontantVerseCustom] = useState("");

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const montantTotalCalculated = lignes.reduce((acc, l) => acc + (Number(l.prixUnitaire) * Number(l.quantite) || 0), 0);

  const addLigne = () => setLignes([...lignes, { produit: "", prixUnitaire: 0, quantite: 1 }]);
  const removeLigne = (idx: number) => setLignes(lignes.filter((_, i) => i !== idx));
  const updateLigne = (idx: number, field: string, value: any) => {
    const newLignes = [...lignes];
    (newLignes[idx] as any)[field] = value;
    setLignes(newLignes);
  };

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    formData.append("statut", "EN_ATTENTE");

    if (isSupplierMode) {
      if (lignes.length === 0 || !lignes[0].produit) {
        setError("Veuillez saisir au moins un produit.");
        setIsLoading(false);
        return;
      }
      formData.set("montant", montantTotalCalculated.toString());
      formData.append("lignes", JSON.stringify(lignes));
      formData.append("statutPaiement", statutPaiement);
      
      let finalMontantVerse = 0;
      if (statutPaiement === "PAYE") finalMontantVerse = montantTotalCalculated;
      if (statutPaiement === "IMPAYE") finalMontantVerse = 0;
      if (statutPaiement === "AVANCE") finalMontantVerse = Number(montantVerseCustom) || 0;
      
      if (finalMontantVerse > montantTotalCalculated) {
        setError(`Le montant versé (${finalMontantVerse} FCFA) ne peut pas dépasser le total (${montantTotalCalculated} FCFA).`);
        setIsLoading(false);
        return;
      }

      formData.append("montantVerse", finalMontantVerse.toString());
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const payload = Object.fromEntries(formData.entries());
      const { SyncManager } = await import('@/lib/syncQueue');
      await SyncManager.enqueue('CREATE', 'Operation', {
         id: crypto.randomUUID(),
         type: 'DEPENSE',
         ...payload
      });
      toast.success("Enregistré hors-ligne. En attente de réseau.");
      router.push("/dashboard/expenses");
      return;
    }

    try {
      const result = await createExpenseAction(formData);

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        setIsLoading(false);
      } else {
        toast.success("Opération soumise avec succès !");
        router.push("/dashboard/expenses");
      }
    } catch (err: any) {
      // Fallback in case fetch fails due to network mid-flight
      const payload = Object.fromEntries(formData.entries());
      const { SyncManager } = await import('@/lib/syncQueue');
      await SyncManager.enqueue('CREATE', 'Operation', {
         id: crypto.randomUUID(),
         type: 'DEPENSE',
         ...payload
      });
      toast.success("Réseau instable. Enregistré hors-ligne.");
      router.push("/dashboard/expenses");
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
          {error}
        </div>
      )}

      {fournisseurs.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="fournisseurId">Fournisseur (Lier à un achat)</Label>
          <input type="hidden" name="fournisseurId" value={selectedFournisseurId !== "none" ? selectedFournisseurId : ""} />
          <Select value={selectedFournisseurId || undefined} onValueChange={(val) => { setSelectedFournisseurId(val as string); }}>
            <SelectTrigger className="h-11 bg-muted/30 border-emerald-200">
              {selectedFournisseurId && selectedFournisseurId !== "none" ? (
                <span className="truncate font-bold text-emerald-800">{fournisseurs.find(f => f.id === selectedFournisseurId)?.nom}</span>
              ) : (
                <span className="text-slate-500">Aucun fournisseur (Dépense simple)</span>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="font-bold">Aucun fournisseur (Dépense simple)</SelectItem>
              {fournisseurs.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {!isSupplierMode ? (
        <div className="space-y-2">
          <Label htmlFor="montant">Montant (FCFA) *</Label>
          <div className="relative">
            <Input 
              id="montant" 
              name="montant" 
              type="number" 
              inputMode="decimal"
              pattern="[0-9]*"
              placeholder="ex: 15000" 
              required 
              className="pl-4 h-12 text-lg font-semibold bg-muted/30"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              FCFA
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-bold text-emerald-900">Articles / Produits achetés</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLigne} className="h-8 gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
              <PlusCircle className="h-4 w-4" /> Ajouter
            </Button>
          </div>
          
          <div className="space-y-3">
            {lignes.map((ligne, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 w-full space-y-1">
                  <Label className="text-xs text-slate-500">Produit</Label>
                  <Input required placeholder="Désignation" value={ligne.produit} onChange={(e) => updateLigne(idx, "produit", e.target.value)} />
                </div>
                <div className="w-full sm:w-24 space-y-1">
                  <Label className="text-xs text-slate-500">Prix U.</Label>
                  <Input required type="number" min="0" placeholder="0" value={ligne.prixUnitaire || ""} onChange={(e) => updateLigne(idx, "prixUnitaire", e.target.value)} />
                </div>
                <div className="w-full sm:w-20 space-y-1">
                  <Label className="text-xs text-slate-500">Qté</Label>
                  <Input required type="number" min="1" placeholder="1" value={ligne.quantite || ""} onChange={(e) => updateLigne(idx, "quantite", e.target.value)} />
                </div>
                <div className="w-full sm:w-28 space-y-1">
                  <Label className="text-xs text-slate-500">Sous-total</Label>
                  <div className="h-10 flex items-center px-3 bg-white border rounded-md text-sm font-bold text-slate-700">
                    {((Number(ligne.prixUnitaire) * Number(ligne.quantite)) || 0).toLocaleString()} F
                  </div>
                </div>
                {lignes.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLigne(idx)} className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-emerald-100">
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">TOTAL DE L'ACHAT</p>
              <p className="text-2xl font-black text-emerald-700">{montantTotalCalculated.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-100 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Statut du paiement</Label>
              <Select value={statutPaiement} onValueChange={(val) => setStatutPaiement(val as string)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYE">Totalement Payé</SelectItem>
                  <SelectItem value="IMPAYE">Impayé (Dette entière)</SelectItem>
                  <SelectItem value="AVANCE">Avance (Paiement partiel)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {statutPaiement === "AVANCE" && (
              <div className="space-y-2">
                <Label>Montant Versé (FCFA)</Label>
                <Input type="number" required max={montantTotalCalculated} value={montantVerseCustom} onChange={(e) => setMontantVerseCustom(e.target.value)} className="bg-white font-bold" />
              </div>
            )}
            {statutPaiement === "AVANCE" && (
              <div className="space-y-2 sm:col-span-2 text-right">
                <Label className="text-slate-500">Reste à payer : <span className="font-bold text-red-500">{(montantTotalCalculated - (Number(montantVerseCustom) || 0)).toLocaleString('fr-FR')} FCFA</span></Label>
              </div>
            )}
          </div>
        </div>
      )}

      {agencies && agencies.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="agencyId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Agence concernée / destinataire</Label>
          <Select required name="agencyId" value={selectedAgencyId || undefined} onValueChange={(val) => setSelectedAgencyId(val as string)}>
            <SelectTrigger className="h-11 bg-muted/30">
              {selectedAgencyId ? (
                <span className="truncate">{agencies?.find(a => a.id === selectedAgencyId)?.nom}</span>
              ) : (
                <SelectValue placeholder="Sélectionner une agence" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Ligne 1</SelectLabel>
                {agencies.filter(a => a.nom.toLowerCase().includes("mbalmayo") || a.nom.toLowerCase().includes("mvan")).map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>{agency.nom}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Ligne 2</SelectLabel>
                {agencies.filter(a => a.nom.toLowerCase().includes("mimboman") || a.nom.toLowerCase().includes("ayos") || a.nom.toLowerCase().includes("akonolinga")).map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>{agency.nom}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="categoryId">Catégorie de la dépense *</Label>
        <input type="hidden" name="categoryId" value={selectedCategoryId} />
        <Select name="categoryId" required value={selectedCategoryId || undefined} onValueChange={(val) => setSelectedCategoryId(val as string)}>
          <SelectTrigger className="h-11 bg-muted/30">
            {selectedCategory ? (
              <span className="truncate">{selectedCategory.nom}</span>
            ) : (
              <SelectValue placeholder="Sélectionner une catégorie" />
            )}
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOperation">Date de l'opération</Label>
          <Input id="dateOperation" name="dateOperation" type="date" className="h-11 bg-muted/30 w-full" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commentaire">Motif / Commentaire *</Label>
          <Input id="commentaire" name="commentaire" placeholder="Ex: Achat de matériel" required className="h-11 bg-muted/30" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Justificatif (Photo / Facture)</Label>
        {!fileName ? (
          <ImageUploadPicker 
            onSelectCamera={() => setIsCameraOpen(true)}
            onSelectGallery={() => fileInputRef.current?.click()}
          />
        ) : (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm border mt-3">
            <FileCheck2 className="w-4 h-4 text-green-600" />
            <span className="truncate flex-1">{fileName}</span>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFileName(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Supprimer
            </Button>
          </div>
        )}

        <input 
          type="file" 
          name="justificatif" 
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFileName(e.target.files[0].name);
            } else {
              setFileName(null);
            }
          }}
        />
      </div>

      <CameraCapture 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        title="Photographier le justificatif"
        onFallback={() => fileInputRef.current?.click()}
        onCapture={(file) => {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            setFileName(file.name);
          }
        }}
      />

      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border/40">
        <Button type="submit" disabled={isLoading} className="h-11 w-full shadow-md shadow-primary/20">
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </form>
  );
}
