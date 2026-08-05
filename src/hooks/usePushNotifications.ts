"use client";

import { useState, useEffect } from "react";
import { requestFirebaseToken } from "@/lib/firebase/client";
import { registerDeviceToken, unregisterDeviceToken } from "@/actions/deviceActions";
import { useConfirm } from "@/hooks/useConfirm";
import { toast } from "sonner";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");
  const [isLoading, setIsLoading] = useState(true);
  const { confirm } = useConfirm();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/set-state-in-effect

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
    setIsLoading(false);
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Votre navigateur ou appareil ne supporte pas les notifications Push.");
      return false;
    }

    // Checking for iOS PWA limitations
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      // Very basic iOS detection for PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
      if (!isStandalone) {
        toast.info("Ajoutez REGIONALE EXPRESS VOYAGES SARL à votre écran d'accueil afin d'activer les notifications Push sur iPhone.");
        return false;
      }
    }

    return new Promise<boolean>((resolve) => {
      confirm({
        title: "Activer les notifications",
        description: "REGIONALE EXPRESS VOYAGES SARL souhaite vous envoyer des notifications afin de vous informer instantanément des dépenses, versements, validations, objectifs bancaires et autres événements importants.",
        confirmText: "Autoriser",
        onConfirm: async () => {
          try {
            // Validate Firebase config before asking permission
            const configRes = await fetch('/api/firebase-config');
            const config = await configRes.json();
            
            if (!config.apiKey || !config.projectId) {
              toast.error("Erreur de configuration Firebase : clés manquantes. Veuillez contacter l'administrateur.");
              resolve(false);
              return;
            }

            const perm = await Notification.requestPermission();
            setPermission(perm);
            
            if (perm === "granted") {
              const token = await requestFirebaseToken();
              if (token) {
                const userAgent = navigator.userAgent;
                const result = await registerDeviceToken(token, userAgent);
                if (result.success) {
                  toast.success("Notifications activées avec succès pour cet appareil !");
                  resolve(true);
                  return;
                } else {
                  toast.error("Erreur d'enregistrement côté serveur : " + (result.error || "Inconnue"));
                }
              } else {
                toast.error("Erreur lors de la génération du token FCM. Vérifiez vos clés et votre clé VAPID.");
              }
            } else if (perm === "denied") {
              toast.error("Notifications bloquées. Veuillez modifier les paramètres de votre navigateur.");
            }
          } catch (e: any) {
            console.error("Erreur de permission:", e);
            const errMsg = e instanceof Error ? e.message : String(e);
            toast.error(`Erreur d'autorisation : ${errMsg}. Sur iOS, vérifiez les réglages Safari > Avancé > Experimental Features.`);
          }
          resolve(false);
        },
        onCancel: () => resolve(false)
      });
    });
  };

  const disableNotifications = async (currentToken: string) => {
    try {
      const result = await unregisterDeviceToken(currentToken);
      if (result.success) {
        toast.success("Notifications désactivées pour cet appareil.");
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    toast.error("Erreur lors de la désactivation.");
    return false;
  };

  return {
    isSupported,
    permission,
    isLoading,
    requestPermission,
    disableNotifications
  };
}
