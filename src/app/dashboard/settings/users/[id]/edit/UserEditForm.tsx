"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Agency } from "@prisma/client";
import { updateUserAction } from "../../actions";

export function UserEditForm({ user, agencies, currentUserRole = "PDG", currentUserId = "" }: { user: User, agencies: Agency[], currentUserRole?: string, currentUserId?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    agencyId: user.agencyId || "",
    telephone: user.telephone || "",
  });

  const isPDG = currentUserRole === "PDG";
  const isSelf = user.id === currentUserId;
  const canEditInfo = isPDG || isSelf;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Enregistrement en cours...");

    const res = await updateUserAction(user.id, formData);

    if (res?.success) {
      toast.success("Utilisateur mis à jour avec succès", { id: toastId });
      router.push("/dashboard/settings/users");
      router.refresh();
    } else {
      toast.error(res?.error || "Une erreur est survenue", { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom *</label>
              <Input 
                required 
                value={formData.nom} 
                onChange={(e) => setFormData({ ...formData, nom: e.target.value.toUpperCase() })} 
                disabled={!canEditInfo}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prénom *</label>
              <Input 
                required 
                value={formData.prenom} 
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} 
                disabled={!canEditInfo}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input 
                required 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                disabled={!canEditInfo}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Téléphone</label>
              <Input 
                type="tel"
                value={formData.telephone} 
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} 
                placeholder="Ex: +237 6XX XXX XXX"
                disabled={!canEditInfo}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Rôle *</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as any})}
                disabled={!isPDG}
              >
                <option value="DG">Directeur Général (DG)</option>
                <option value="DGA">Directeur Général Adjoint (DGA)</option>
                <option value="CHEF_AGENCE">Chef d'Agence</option>
                <option value="COMPTABLE">Comptable</option>
                <option value="CAISSIER">Caissier</option>
                <option value="SECRETAIRE">Secrétaire</option>
                <option value="AGENT">Agent (Standard)</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Agence d'affectation</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                value={formData.agencyId} 
                onChange={e => setFormData({...formData, agencyId: e.target.value})}
                disabled={!isPDG}
              >
                <option value="">-- Aucune agence (PDG/DG uniquement) --</option>
                {agencies.map(a => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/dashboard/settings/users")}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
