'use client';

import { useState } from 'react';
import { createUser } from './actions';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Key, Filter, CheckCircle2, XCircle, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EntityActionsMenu } from "@/components/EntityActionsMenu";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', role: 'AGENT', pin: '' });

  const filteredUsers = users.filter(u =>
    `${u.nom} ${u.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length < 6) {
      toast.error("Le PIN doit contenir au moins 6 chiffres.");
      return;
    }
    const toastId = toast.loading("Création en cours...");
    const res = await createUser(formData);
    if (res.success) {
      toast.success("Utilisateur créé avec succès !", { id: toastId });
      setIsCreating(false);
      setFormData({ nom: '', prenom: '', email: '', role: 'AGENT', pin: '' });
      window.location.reload();
    } else {
      toast.error(res.error, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Rechercher un utilisateur..."
            className="pl-10 h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-primary hover:bg-primary/90 h-12 rounded-xl px-6">
          <Plus className="w-5 h-5 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Créer un accès sécurisé
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nom</label>
                <Input required value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value.toUpperCase() })} placeholder="Ex: DIOP" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Prénom</label>
                <Input required value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} placeholder="Ex: Amadou" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email (Unique)</label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="agent@rex.com" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Rôle</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
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
                <label className="text-xs font-bold text-muted-foreground uppercase">Code PIN (6+ chiffres)</label>
                <Input required type="password" minLength={6} value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })} placeholder="******" />
              </div>
              <div className="lg:col-span-5 flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Annuler</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Enregistrer l'accès</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="actifs" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="actifs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium px-4">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Actifs ({filteredUsers.filter(u => u.isActive).length})
            </TabsTrigger>
            <TabsTrigger value="suspendus" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium px-4">
              <XCircle className="w-3.5 h-3.5 mr-2 text-destructive" /> Suspendus ({filteredUsers.filter(u => !u.isActive).length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="actifs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.filter(u => u.isActive).map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
          {filteredUsers.filter(u => u.isActive).length === 0 && (
            <div className="text-center py-20">
              <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">Aucun utilisateur actif trouvé</h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suspendus" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.filter(u => !u.isActive).map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
          {filteredUsers.filter(u => !u.isActive).length === 0 && (
            <div className="text-center py-20">
              <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">Aucun compte suspendu</h3>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserCard({ user }: { user: any }) {
  return (
    <Card
      className={`overflow-hidden transition-all duration-300 ${!user.isActive ? 'opacity-70 grayscale-[0.3]' : 'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30'}`}
    >
      <CardContent className="p-0">
        <div className={`h-2 w-full ${user.role === 'PDG' ? 'bg-purple-500' : user.role === 'DG' ? 'bg-blue-500' : 'bg-primary'}`} />
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg text-foreground line-clamp-1">{user.nom} {user.prenom}</h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              {user.telephone && (
                <p className="text-xs text-muted-foreground mt-0.5">{user.telephone}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="outline"
                className={`font-bold ${user.role === 'PDG'
                  ? 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300'
                  : 'text-primary border-primary/30 bg-primary/5'}`}
              >
                {user.role}
              </Badge>
              <EntityActionsMenu
                id={user.id}
                type="user"
                isActive={user.isActive}
                onEditUrl={`/dashboard/settings/users/${user.id}/edit`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-destructive'}`} />
            {user.isActive ? 'Accès Actif' : 'Accès Suspendu'}
            {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
              <span className="text-amber-500 flex items-center gap-1 ml-2">
                <Shield className="w-3 h-3" /> Verrouillé
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
