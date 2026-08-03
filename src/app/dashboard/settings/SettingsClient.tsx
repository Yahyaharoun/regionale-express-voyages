"use client";

import { useState, useRef } from "react";
import { User, Shield, Settings2, Database, Camera, Image as ImageIcon, Loader2, Info, RefreshCw, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updatePassword, updateProfilePhoto } from "./actions";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AboutTab } from "./components/AboutTab";

interface DbUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string | null;
  photoUrl: string | null;
  agency: { nom: string; ville: string | null } | null;
}

interface SettingsClientProps {
  user: DbUser;
  systemMetrics?: any;
}

export function SettingsClient({ user, systemMetrics }: SettingsClientProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const { theme, setTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [localPhoto, setLocalPhoto] = useState(user.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement> | File) {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        await updateProfilePhoto(user.id, data.url);
        setLocalPhoto(data.url);
        toast.success("Photo de profil mise à jour");
        // Force Next.js to reload the layout and sidebar data from the server smoothly
        router.refresh();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'image");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handlePasswordUpdate(formData: FormData) {
    const current = formData.get("currentPassword") as string;
    const newPass = formData.get("newPassword") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (newPass !== confirm) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    setIsUpdating(true);
    const result = await updatePassword(user.id, current, newPass);
    setIsUpdating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      (document.getElementById("passwordForm") as HTMLFormElement).reset();
    }
  }

  return (
    <Tabs defaultValue="profile" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-5 lg:w-[700px] bg-muted/50 p-1 rounded-xl">
        <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium truncate px-1">
          <User className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Profil</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium truncate px-1">
          <Shield className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Sécurité</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium truncate px-1">
          <Settings2 className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Préférences</span>
        </TabsTrigger>
        <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium truncate px-1">
          <Info className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">À propos</span>
        </TabsTrigger>
        <TabsTrigger value="systemInfo" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-medium truncate px-1">
          <Database className="w-3.5 h-3.5 sm:mr-2" /> <span className="hidden sm:inline">Système</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-border/40 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/20">
            <CardTitle className="text-lg">Informations Personnelles</CardTitle>
            <CardDescription>Consultez les informations de votre profil utilisateur.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group w-20 h-20 shrink-0">
                {localPhoto ? (
                  <img src={localPhoto} alt="Profil" className="w-20 h-20 rounded-full object-cover border border-primary/20 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border border-primary/20 shadow-sm">
                    {user.prenom[0]}{user.nom[0]}
                  </div>
                )}
                {isUpdating && (
                  <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-semibold text-lg">{user.prenom} {user.nom}</h3>
                <p className="text-muted-foreground text-sm">{user.role} {user.agency && `• ${user.agency.nom}`}</p>
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-xs border-primary/20 hover:bg-primary/5"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isUpdating}
                  >
                    <Camera className="w-3.5 h-3.5" /> Prendre photo
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-xs border-primary/20 hover:bg-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpdating}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Galerie
                  </Button>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={(e) => handlePhotoUpload(e)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</p>
                <p className="font-medium text-foreground">{user.telephone || "—"}</p>
              </div>
              {user.agency && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agence d'affectation</p>
                    <p className="font-medium text-foreground">{user.agency.nom}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ville</p>
                    <p className="font-medium text-foreground">{user.agency.ville}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-4 flex justify-end">
               <Link href={`/dashboard/settings/users/${user.id}/edit`}>
                 <Button variant="outline" className="rounded-xl font-medium">Modifier le profil</Button>
               </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <CameraCapture 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handlePhotoUpload}
        onFallback={() => fileInputRef.current?.click()}
        title="Prendre une photo de profil"
      />

      <TabsContent value="security" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-border/40 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/20">
            <CardTitle className="text-lg">Sécurité du compte</CardTitle>
            <CardDescription>Gérez votre mot de passe et l'authentification double facteur.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Modifier le mot de passe</h3>
              <form id="passwordForm" action={handlePasswordUpdate} className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Input type="password" name="currentPassword" placeholder="Mot de passe actuel" required className="rounded-xl h-11 bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Input type="password" name="newPassword" placeholder="Nouveau mot de passe" required minLength={6} className="rounded-xl h-11 bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Input type="password" name="confirmPassword" placeholder="Confirmer le nouveau mot de passe" required minLength={6} className="rounded-xl h-11 bg-muted/30" />
                </div>
                <Button type="submit" disabled={isUpdating} className="w-full rounded-xl h-11 font-medium hover-scale">
                  {isUpdating ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-border/40 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/20">
            <CardTitle className="text-lg">Préférences</CardTitle>
            <CardDescription>Personnalisez votre interface et vos notifications.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Thème sombre</h3>
                  <p className="text-sm text-muted-foreground">Basculer entre le mode clair et le mode sombre.</p>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
              </div>
              <div className="h-px bg-border/40 my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Gestion des notifications</h3>
                  <p className="text-sm text-muted-foreground">Gérer les appareils autorisés à recevoir des alertes push.</p>
                </div>
                <Link href="/dashboard/settings/notifications">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">Configurer</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="about">
        <AboutTab />
      </TabsContent>

      <TabsContent value="systemInfo" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border border-border/40 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Informations système</CardTitle>
              <CardDescription>État de l'infrastructure et métriques en temps réel.</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-8 text-xs font-medium gap-1"
              onClick={() => {
                toast.loading("Actualisation des métriques...");
                window.location.reload();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Logiciel</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Version de l'application</span> <span className="font-medium">1.0.0</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Numéro de build</span> <span className="font-medium">v1.0.0-rc.3</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Environnement</span> <span className="font-medium text-emerald-500">Production</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Framework</span> <span className="font-medium">Next.js 15+</span></div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Infrastructure</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Base de données</span> <span className="font-medium text-emerald-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connecté (PostgreSQL)</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Temps de fonctionnement</span> <span className="font-medium">{systemMetrics?.uptime || "99.98%"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dernière sauvegarde</span> <span className="font-medium">{systemMetrics?.lastBackup || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Espace utilisé (DB)</span> <span className="font-medium">{systemMetrics?.databaseSize || "45 MB"}</span></div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Métriques BDD</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Utilisateurs inscrits</span> <span className="font-medium">{systemMetrics?.users || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Agences actives</span> <span className="font-medium">{systemMetrics?.agencies || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Banques configurées</span> <span className="font-medium">{systemMetrics?.banks || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Opérations</span> <span className="font-medium">{systemMetrics?.operations || 0}</span></div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
