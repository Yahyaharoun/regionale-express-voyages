"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDepositAction } from "@/actions/operationActions";
import { Loader2, FileCheck2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bank } from "@prisma/client";
import { ImageUploadPicker } from "@/components/ImageUploadPicker";

interface DepositFormProps {
  banks: Bank[];
}

export function DepositForm({ banks }: DepositFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const selectedBank = banks.find(b => b.id === selectedBankId);

  // Ref booléen pour protection anti-doublons côté client
  // useRef est préféré à useState pour éviter les re-renders
  const isSubmitting = useRef(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Protection : ignorer si déjà en cours de soumission
    if (isSubmitting.current) return;

    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("statut", "EN_ATTENTE");

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const payload = Object.fromEntries(formData.entries());
        const { SyncManager } = await import('@/lib/syncQueue');
        await SyncManager.enqueue('CREATE', 'Operation', {
           id: crypto.randomUUID(),
           type: 'VERSEMENT',
           ...payload
        });
        toast.success("Mode hors-ligne : Versement enregistré localement. Il sera synchronisé dès le retour de la connexion.");
        router.push("/dashboard/deposits");
        return;
      }

      const result = await createDepositAction(formData);

      if (result?.error) {
        // Si c'est un doublon détecté côté serveur, message spécifique
        if ((result as any).duplicate) {
          toast.warning("Ce versement a déjà été enregistré. Vérifiez la liste des versements.");
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      } else {
        toast.success("Versement soumis avec succès !");
        router.push("/dashboard/deposits");
        return; // Ne pas reset isSubmitting car on quitte la page
      }
    } catch (err: any) {
      // Fallback in case fetch fails due to network mid-flight
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      const { SyncManager } = await import('@/lib/syncQueue');
      await SyncManager.enqueue('CREATE', 'Operation', {
         id: crypto.randomUUID(),
         type: 'VERSEMENT',
         ...payload
      });
      toast.success("Réseau instable. Versement enregistré hors-ligne.");
      router.push("/dashboard/deposits");
    } finally {
      // Réactiver le bouton seulement en cas d'erreur (succès = navigation)
      setIsLoading(false);
      isSubmitting.current = false;
    }
  }, [router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
          {error}
        </div>
      )}

      {/* Banque */}
      <div className="space-y-2">
        <Label htmlFor="bankId">Banque de dépôt *</Label>
        <input type="hidden" name="bankId" value={selectedBankId} />
        <Select name="bankId" required value={selectedBankId || undefined} onValueChange={(val) => setSelectedBankId(val as string)}>
          <SelectTrigger className="h-11 bg-muted/30">
            {selectedBank ? (
              <span className="truncate">{`${selectedBank.nom} (${selectedBank.numeroCompte})`}</span>
            ) : (
              <SelectValue placeholder="Sélectionner une banque" />
            )}
          </SelectTrigger>
          <SelectContent>
            {banks.map((bank) => (
              <SelectItem key={bank.id} value={bank.id}>
                {`${bank.nom} (${bank.numeroCompte})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Montant */}
      <div className="space-y-2">
        <Label htmlFor="montant">Montant à verser (FCFA) *</Label>
        <div className="relative">
          <Input
            id="montant"
            name="montant"
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="ex: 500000"
            required
            min={1}
            className="pl-4 h-12 text-lg font-semibold bg-muted/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            FCFA
          </div>
        </div>
      </div>

      {/* Référence du bordereau */}
      <div className="space-y-2">
        <Label htmlFor="reference">Référence du bordereau *</Label>
        <Input
          id="reference"
          name="reference"
          placeholder="ex: BORD-2026-001"
          required
          className="h-11 bg-muted/30"
        />
      </div>

      {/* Justificatif (photo uniquement) */}
      <div className="space-y-2">
        <Label>Justificatif de versement</Label>

        <ImageUploadPicker
          onSelectCamera={() => setIsCameraOpen(true)}
          onSelectGallery={() => fileInputRef.current?.click()}
        />

        <input
          type="file"
          name="justificatif"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp, image/heic"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFileName(e.target.files[0].name);
            } else {
              setFileName(null);
            }
          }}
        />

        {fileName && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20 text-sm font-medium">
            <FileCheck2 className="w-5 h-5 shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>
        )}
      </div>

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        title="Scanner le bordereau"
        onFallback={() => fileInputRef.current?.click()}
        onCapture={(file) => {
          // Simuler la sélection du fichier via DataTransfer
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            setFileName(file.name);
          }
        }}
      />

      {/* Commentaire (optionnel) */}
      <div className="space-y-2">
        <Label htmlFor="commentaire">Commentaire <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
        <Textarea
          id="commentaire"
          name="commentaire"
          placeholder="Informations complémentaires sur ce versement..."
          className="bg-muted/30 resize-none"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border/40">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full shadow-md shadow-primary/20"
          aria-label="Enregistrer le versement bancaire"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement en cours...
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </form>
  );
}
