/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, BackgroundSyncPlugin, NetworkOnly } from "serwist";
import { defaultCache } from "@serwist/next/worker";

// Déclaration de l'environnement Service Worker
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
  runtimeCaching: [
    {
      matcher: ({ url }) => {
        // Exclure les images publiques Supabase pour autoriser leur mise en cache
        const isSupabaseImage = url.host.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/');
        return url.pathname.startsWith('/api/auth') || (url.host.includes('supabase.co') && !isSupabaseImage);
      },
      handler: new NetworkOnly(),
    },
    ...defaultCache,
    {
      matcher: ({ request }) => request.method === 'POST',
      handler: new NetworkOnly({
        plugins: [
          new BackgroundSyncPlugin('offline-mutations', {
            maxRetentionTime: 24 * 60,
          }),
        ],
      }),
    }
  ],
});

// Initialiser le système PWA avec cache intelligent et Background Sync
serwist.addEventListeners();
