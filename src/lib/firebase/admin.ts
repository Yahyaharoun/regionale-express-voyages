import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      const parsedServiceAccount = JSON.parse(serviceAccount);
      
      // Ensure private key newlines are correctly formatted (especially when loaded from .env)
      if (parsedServiceAccount.private_key) {
        parsedServiceAccount.private_key = parsedServiceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "regionale-express-voyage.firebasestorage.app",
      });
      console.log("Firebase Admin Initialized successfully.");
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY manquant. Firebase Admin ne peut pas être initialisé.");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Firebase Admin :", error);
  }
}

export const adminMessaging = admin.apps.length ? admin.messaging() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;
