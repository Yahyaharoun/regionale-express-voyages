// ============================================================
// REGIONALE EXPRESS VOYAGES SARL — Firebase Messaging SW
// Version: 2.0 — Sans race condition
// ============================================================
// IMPORTANT : Ce Service Worker utilise firebase-app-compat et
// firebase-messaging-compat afin de supporter les messages
// background (téléphone verrouillé, app fermée, arrière-plan).
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// ============================================================
// CONFIGURATION FIREBASE — Injectée par Next.js au chargement
// ============================================================
// Le SW lit sa propre config depuis l'URL de registration.
// On utilise un cache in-memory pour éviter le fetch asynchrone
// qui cause la race condition.
// ============================================================

let firebaseApp = null;
let messaging = null;

// Initialiser Firebase de manière synchrone si la config est
// passée via les paramètres du SW (ou utiliser des valeurs de
// fallback depuis le cache).
function initFirebase(config) {
  if (firebaseApp) return; // Déjà initialisé

  if (!config || !config.apiKey || !config.projectId) {
    console.warn("[SW] Config Firebase invalide, abandon de l'initialisation.");
    return;
  }

  try {
    firebaseApp = firebase.initializeApp(config);
    messaging = firebase.messaging();

    // Enregistrer le handler IMMÉDIATEMENT après init
    messaging.onBackgroundMessage((payload) => {
      console.log("[SW] Message background reçu :", payload);

      const notificationTitle = payload.notification?.title || "Notification REX";
      const notificationBody  = payload.notification?.body  || "";

      const notificationOptions = {
        body: notificationBody,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        silent: false,
        tag: payload.data?.eventType || "rex-notif",
        renotify: true,
        data: {
          url: payload.data?.url || "/dashboard",
          eventType: payload.data?.eventType || ""
        }
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log("[SW] Firebase Messaging initialisé avec succès.");
  } catch (err) {
    console.error("[SW] Erreur d'initialisation Firebase :", err);
  }
}

// ============================================================
// INSTALL EVENT — Forcer l'activation immédiate du SW
// ============================================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installation du Service Worker REX v2.0");

  // skipWaiting garantit que le nouveau SW est actif immédiatement
  // sans attendre que les anciennes pages soient fermées.
  self.skipWaiting();

  // Fetch la config Firebase pendant l'install pour la mettre en cache
  event.waitUntil(
    fetch("/api/firebase-config")
      .then((res) => res.json())
      .then((config) => {
        // Stocker la config dans le cache SW pour usage ultérieur
        return caches.open("firebase-config-v1").then((cache) => {
          const configResponse = new Response(JSON.stringify(config), {
            headers: { "Content-Type": "application/json" }
          });
          return cache.put("firebase-config", configResponse);
        });
      })
      .catch((err) => {
        console.error("[SW] Erreur lors du fetch config pendant install :", err);
      })
  );
});

// ============================================================
// ACTIVATE EVENT — Prendre le contrôle de tous les clients
// ============================================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation du Service Worker REX v2.0");

  event.waitUntil(
    (async () => {
      // Prendre le contrôle de toutes les pages ouvertes immédiatement
      await clients.claim();

      // Lire la config depuis le cache et initialiser Firebase
      try {
        const cache = await caches.open("firebase-config-v1");
        const cached = await cache.match("firebase-config");

        if (cached) {
          const config = await cached.json();
          initFirebase(config);
        } else {
          // Fallback : fetch direct si le cache est vide
          const res = await fetch("/api/firebase-config");
          const config = await res.json();
          initFirebase(config);
        }
      } catch (err) {
        console.error("[SW] Erreur lors de l'init Firebase à l'activation :", err);
      }
    })()
  );
});

// ============================================================
// FETCH EVENT — Intercepter les messages qui arrivent AVANT
// l'initialisation complète (sécurité supplémentaire)
// ============================================================
self.addEventListener("message", async (event) => {
  // Permettre à l'app cliente d'envoyer la config Firebase au SW
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    console.log("[SW] Config reçue depuis la page cliente.");
    initFirebase(event.data.config);
  }

  // Forcer le SW à prendre le contrôle
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ============================================================
// NOTIFICATION CLICK — Redirection à la bonne URL
// ============================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Essayer de trouver un onglet déjà ouvert à remettre au premier plan
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Sinon, ouvrir un nouvel onglet
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ============================================================
// PUSH EVENT (fallback natif — sans Firebase SDK)
// Intercepte les push bruts si Firebase SDK n'est pas encore prêt
// ============================================================
self.addEventListener("push", (event) => {
  // Si Firebase messaging est déjà actif, il gère lui-même les push.
  // Ce handler sert de filet de sécurité.
  if (messaging) return;

  console.log("[SW] Push natif reçu (Firebase pas encore prêt).");

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { notification: { title: "Notification REX", body: event.data?.text() || "" } };
  }

  const title = data.notification?.title || "Notification REX";
  const options = {
    body: data.notification?.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: data.data?.url || "/dashboard" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
