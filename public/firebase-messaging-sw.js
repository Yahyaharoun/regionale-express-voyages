importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Cette configuration doit correspondre aux variables d'environnement, 
// mais le SW n'a pas accès à process.env. 
// Pour l'instant on met une config fictive qui sera initialisée dynamiquement ou devra être complétée par le client.
// Idéalement, en production, on injecte les vraies variables.

// Fetch configuration dynamically from our API
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(firebaseConfig => {
    // Vérifier que la config est valide
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "") {
      console.error("[SW] Firebase config API returned empty keys.");
      return;
    }

    // Initialisation de Firebase
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log("[firebase-messaging-sw.js] Message d'arrière-plan reçu", payload);
      
      const notificationTitle = payload.notification?.title || "Notification REX";
      const notificationOptions = {
        body: payload.notification?.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [200, 100, 200, 100, 200], // Motif de vibration fort
        silent: false, // Force la lecture du son système
        requireInteraction: true, // Reste à l'écran jusqu'à interaction
        data: payload.data
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(e => {
    console.error("[SW] Error fetching firebase config", e);
  });

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  // URL de redirection (par défaut dashboard)
  let targetUrl = "/dashboard";
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
