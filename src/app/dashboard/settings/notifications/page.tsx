"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getUserDevices, unregisterDeviceToken } from "@/actions/deviceActions";
import { testPushNotification } from "@/actions/notificationActions";
import { requestFirebaseToken } from "@/lib/firebase/client";
import { Bell, Smartphone, Trash2, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function NotificationsSettingsPage() {
  const { isSupported, permission, isLoading: hookLoading, requestPermission } = usePushNotifications();
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState<boolean | null>(null);

  const checkFirebaseConfig = async () => {
    try {
      const res = await fetch('/api/firebase-config');
      const data = await res.json();
      setFirebaseConfigured(!!(data.apiKey && data.projectId));
    } catch {
      setFirebaseConfigured(false);
    }
  };

  const loadDevices = async () => {
    setIsLoading(true);
    const res = await getUserDevices();
    if (res.success) {
      setDevices(res.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDevices();
    checkFirebaseConfig();
  }, []);

  const handleRemoveDevice = async (token: string) => {
    const res = await unregisterDeviceToken(token);
    if (res.success) {
      toast.success("Appareil déconnecté des notifications.");
      loadDevices();
    } else {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleTestNotification = async () => {
    if (permission !== "granted") {
      toast.error("Vous devez d'abord autoriser les notifications.");
      return;
    }
    
    setIsTesting(true);
    try {
      // Obtenir le token actuel
      const currentToken = await requestFirebaseToken();
      if (!currentToken) {
        toast.error("Token FCM introuvable. Veuillez réactiver les notifications.");
        setIsTesting(false);
        return;
      }

      // Appeler le backend
      const res = await testPushNotification(currentToken);
      if (res.success) {
        toast.success("Notification de test envoyée avec succès !");
      } else {
        toast.error("Erreur d'envoi : " + res.error);
      }
    } catch (e: any) {
      toast.error("Erreur inattendue : " + e.message);
    }
    setIsTesting(false);
  };

  const hasCurrentDeviceRegistered = () => {
    // Basic heuristic: check if any device in the list is the current one
    return devices.length > 0;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="w-8 h-8 text-primary" />
          Paramètres des Notifications
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos préférences de notifications Push et vos appareils connectés.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistant de Diagnostic</CardTitle>
          <CardDescription>
            Vérifiez l'état complet du système de notifications pour cet appareil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4">
            <DiagnosticItem 
              status={firebaseConfigured} 
              title="Configuration Firebase" 
              descSuccess="Les clés d'environnement (API_KEY, PROJECT_ID...) sont présentes."
              descFail="Il manque des clés d'environnement dans le fichier .env."
            />
            <DiagnosticItem 
              status={isSupported} 
              title="Compatibilité du Navigateur" 
              descSuccess="Votre navigateur supporte les notifications Web Push."
              descFail="Votre navigateur ne supporte pas les Push (ou vous êtes en navigation privée/iOS sans PWA)."
            />
            <DiagnosticItem 
              status={permission === "granted"} 
              title="Autorisation Locale" 
              descSuccess="Vous avez autorisé ce site à envoyer des notifications."
              descFail={permission === "denied" ? "Vous avez bloqué les notifications." : "Vous n'avez pas encore donné l'autorisation."}
            />
            <DiagnosticItem 
              status={permission === "granted" && hasCurrentDeviceRegistered()} 
              title="Enregistrement du Token" 
              descSuccess="Un token FCM sécurisé a été généré et lié à votre compte."
              descFail="Aucun token n'est lié à cet appareil pour le moment."
            />
          </div>

          <div className="pt-4 border-t flex flex-col gap-3">
            {!(permission === "granted" && hasCurrentDeviceRegistered()) ? (
              <Button onClick={async () => { await requestPermission(); loadDevices(); }} disabled={hookLoading || !isSupported || permission === "denied" || firebaseConfigured === false} className="w-full sm:w-auto">
                Activer les notifications sur cet appareil
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" disabled className="w-full sm:w-auto border-emerald-500 text-emerald-600 bg-emerald-50/50 opacity-100 font-semibold">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Notifications Actives
                </Button>
                <Button variant="default" onClick={handleTestNotification} disabled={isTesting} className="w-full sm:w-auto">
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer une notification de test
                </Button>
              </div>
            )}
            
            {firebaseConfigured === false && (
              <p className="text-sm text-destructive font-medium mt-2">
                * Les notifications sont désactivées car la configuration Firebase est manquante.
              </p>
            )}
            {permission === "denied" && (
              <p className="text-sm text-destructive font-medium mt-2">
                * Vous devez réinitialiser les permissions dans les paramètres (cadenas) de votre navigateur.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes Appareils Connectés</CardTitle>
          <CardDescription>
            Liste des appareils autorisés à recevoir vos notifications Push.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
              <Smartphone className="w-12 h-12 mb-3 opacity-20" />
              Aucun appareil n'est actuellement configuré.
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                  <div className="flex items-center gap-4">
                    <Smartphone className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Appareil Enregistré</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md" title={device.userAgent}>
                        {device.userAgent || "Navigateur inconnu"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dernière utilisation : {format(new Date(device.lastUsed), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveDevice(device.token)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosticItem({ status, title, descSuccess, descFail }: { status: boolean | null, title: string, descSuccess: string, descFail: string }) {
  if (status === null) return null; // Loading state essentially
  
  return (
    <div className="flex items-start gap-3">
      {status ? (
        <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="w-6 h-6 text-destructive mt-0.5 shrink-0" />
      )}
      <div>
        <h4 className={`font-semibold ${status ? 'text-foreground' : 'text-destructive'}`}>{title}</h4>
        <p className="text-sm text-muted-foreground">{status ? descSuccess : descFail}</p>
      </div>
    </div>
  );
}
