"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    const handleGlobalClick = (e: MouseEvent) => {
      if (navigator.onLine) return;
      
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        // C'est un lien interne, on force la navigation classique (hard navigation)
        // Cela permet au Service Worker de capturer la requête et d'afficher la page hors-ligne ou le cache
        e.preventDefault();
        e.stopPropagation();
        window.location.href = anchor.href;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full shadow-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-5">
      <WifiOff className="h-4 w-4" />
      Mode Hors-Ligne (Vos actions sont sauvegardées)
    </div>
  );
}
