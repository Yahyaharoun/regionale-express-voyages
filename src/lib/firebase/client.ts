import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, Messaging } from "firebase/messaging";

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

import { onMessage } from "firebase/messaging";

export const onForegroundMessage = () => {
  if (!messaging) return null;
  return onMessage(messaging, async (payload) => {
    console.log("Message au premier plan reçu : ", payload);
    if (Notification.permission === "granted") {
      const title = payload.notification?.title || "Notification REX";
      const options = {
        body: payload.notification?.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [200, 100, 200, 100, 200], // Motif de vibration fort
        data: payload.data,
        silent: false, // Force la lecture du son système
        requireInteraction: true // Reste à l'écran jusqu'à interaction
      };

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // Utilisation du SW garantit le meilleur support natif (PWA iOS, Android, Desktop)
          await registration.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
      } catch (e) {
        new Notification(title, options);
      }
    }
  });
};

export const requestFirebaseToken = async (): Promise<string | null> => {
  try {
    if (!messaging) return null;
    
    // Vous devez créer une paire de clés Web Push (VAPID key) dans les paramètres Firebase
    // et l'ajouter à vos variables d'environnement
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VAPID Key manquante pour les notifications Push.");
      return null;
    }

    const currentToken = await getToken(messaging, { vapidKey });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.log("Aucun token disponible. Demander la permission d'abord.");
      return null;
    }
  } catch (err) {
    console.error("Erreur lors de la récupération du token:", err);
    return null;
  }
};
