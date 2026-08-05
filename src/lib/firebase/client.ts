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
    const options: any = {
      body: payload.notification?.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data,
      requireInteraction: true,
      silent: false
    };

    // explicit sound fallback in foreground for standard browsers
    try {
      const audio = new Audio("data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
      audio.play().catch(e => console.log('Audio play blocked or failed', e));
    } catch(e) {}

    try {
      const registration = await getOrRegisterServiceWorker();
      if (registration) {
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      try {
        new Notification(title, options);
      } catch {
        console.warn("[FCM] Impossible d'afficher la notification foreground.");
      }
    }
  });

  return unsubscribe;
};

export const requestFirebaseToken = async (): Promise<string | null> => {
  try {
    if (!messaging) return null;

    // Fallback à la clé hardcodée si l'environnement Vercel ne la transmet pas
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BPda14TBnRrSD2rGo5bGVDJUCb4sPsyAJZ9DvyLJbBJRb7PZ68OwhpDbj2o8vcKIAqeWM0Odnj2OzVKnQQn1XHI";
    
    if (!vapidKey) {
      console.warn("VAPID Key manquante pour les notifications Push.");
      return null;
    }

    const registration = await getOrRegisterServiceWorker();
    
    if (registration) {
      await sendConfigToServiceWorker();
      const currentToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (currentToken) return currentToken;
      console.log("Aucun token FCM disponible.");
      return null;
    }

    const currentToken = await getToken(messaging, { vapidKey });
    return currentToken || null;
  } catch (err) {
    console.error("Erreur lors de la récupération du token FCM:", err);
    return null;
  }
};
