import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, Messaging, onMessage, Unsubscribe } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only on client side and if config is available
let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

if (typeof window !== "undefined" && firebaseConfig.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Erreur initialisation Firebase:", error);
  }
}

export const getFirebaseMessaging = () => messaging;

/**
 * Enregistre ou récupère le Service Worker Firebase.
 */
export async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  
  try {
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    return await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn("[SW] Erreur d'enregistrement :", err);
    return null;
  }
}

/**
 * Envoie la config Firebase au Service Worker afin d'éliminer
 * toute race condition lors du démarrage du SW.
 * À appeler UNE SEULE FOIS après l'enregistrement du SW.
 */
export async function sendConfigToServiceWorker(): Promise<void> {
  try {
    const registration = await getOrRegisterServiceWorker();
    if (registration && registration.active) {
      registration.active.postMessage({
        type: "FIREBASE_CONFIG",
        config: firebaseConfig,
      });
    }
  } catch (err) {
    console.warn("[FCM] Impossible d'envoyer la config au SW :", err);
  }
}

/**
 * Abonnement aux messages foreground Firebase (application ouverte).
 * Retourne une fonction d'unsubscription à appeler dans le cleanup
 * de useEffect pour éviter les memory leaks.
 *
 * @returns Unsubscribe function or null if messaging is not available
 */
export const onForegroundMessage = (): Unsubscribe | null => {
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, async (payload) => {
    console.log("[FCM] Message foreground reçu : ", payload);

    if (Notification.permission !== "granted") return;

    const title = payload.notification?.title || "Notification REX";
    // Cast en 'any' pour les propriétés étendues (vibrate, requireInteraction)
    // qui sont supportées par Chrome/Edge mais pas dans le type standard
    const options: any = {
      body: payload.notification?.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data,
      requireInteraction: true,
    };

    try {
      const registration = await getOrRegisterServiceWorker();
      if (registration) {
        // Utilisation du SW garantit le meilleur support natif (PWA iOS, Android, Desktop)
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      // Fallback direct si le SW n'est pas disponible
      try {
        new Notification(title, options);
      } catch {
        console.warn("[FCM] Impossible d'afficher la notification foreground.");
      }
    }
  });

  return unsubscribe;
};

/**
 * Obtient le token FCM pour cet appareil.
 * Nécessite que la permission de notification soit accordée.
 */
export const requestFirebaseToken = async (): Promise<string | null> => {
  try {
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VAPID Key manquante pour les notifications Push.");
      return null;
    }

    // S'assurer que le SW est bien enregistré avant de demander le token
    const registration = await getOrRegisterServiceWorker();
    
    if (registration) {
      // Envoyer la config au SW pour s'assurer qu'il est correctement initialisé
      await sendConfigToServiceWorker();

      const currentToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

      if (currentToken) {
        return currentToken;
      } else {
        console.log("Aucun token FCM disponible. Permission peut-être manquante.");
        return null;
      }
    }

    const currentToken = await getToken(messaging, { vapidKey });
    return currentToken || null;
  } catch (err) {
    console.error("Erreur lors de la récupération du token FCM:", err);
    return null;
  }
};
