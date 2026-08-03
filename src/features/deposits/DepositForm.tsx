"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepositAction } from "@/actions/operationActions";
import { Loader2, UploadCloud, Camera, Image as ImageIcon, FileCheck2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bank } from "@prisma/client";

interface DepositFormProps {
  banks: Bank[];
  agencies?: any[];
}

export function DepositForm({ banks, agencies = [] }: DepositFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const selectedBank = banks.find(b => b.id === selectedBankId);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    formData.append("statut", "EN_ATTENTE");

    const result = await createDepositAction(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Versement soumis avec succès !");
      router.push("/dashboard/deposits");
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="montant">Montant (FCFA) *</Label>
        <div className="relative">
          <Input 
            id="montant" 
            name="montant" 
            type="number" 
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="ex: 500000" 
            required 
            className="pl-4 h-12 text-lg font-semibold bg-muted/30"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            FCFA
          </div>
        </div>
      </div>

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

      {agencies && agencies.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="agencyId" className="after:content-['*'] after:ml-0.5 after:text-red-500">Agence concernée</Label>
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
                <SelectLabel>Ligne 1 (Mbalmayo + Yaoundé Mvan)</SelectLabel>
                {agencies.filter(a => a.nom.toLowerCase().includes("mbalmayo") || a.nom.toLowerCase().includes("mvan")).map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Ligne 2 (Yaoundé Mimboman + Ayos + Akonolinga)</SelectLabel>
                {agencies.filter(a => a.nom.toLowerCase().includes("mimboman") || a.nom.toLowerCase().includes("ayos") || a.nom.toLowerCase().includes("akonolinga")).map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Autres</SelectLabel>
                {agencies.filter(a => !a.nom.toLowerCase().includes("mbalmayo") && !a.nom.toLowerCase().includes("mvan") && !a.nom.toLowerCase().includes("mimboman") && !a.nom.toLowerCase().includes("ayos") && !a.nom.toLowerCase().includes("akonolinga")).map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

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

      <div className="space-y-2">
        <Label>Justificatif de versement</Label>
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          <Button
            type="button"
            variant="outline"
            className="h-14 border-primary/20 hover:bg-primary/5 flex flex-col items-center justify-center gap-1"
            onClick={() => setIsCameraOpen(true)}
          >
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-xs">Prendre photo</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="h-14 border-primary/20 hover:bg-primary/5 flex flex-col items-center justify-center gap-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-5 h-5 text-primary" />
            <span className="text-xs">Galerie / Fichier</span>
          </Button>
        </div>

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
          // Create a DataTransfer object to simulate file input selection
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            setFileName(file.name);
          }
        }}
      />

      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border/40">
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="h-11 w-full shadow-md shadow-primary/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </form>
  );
}
