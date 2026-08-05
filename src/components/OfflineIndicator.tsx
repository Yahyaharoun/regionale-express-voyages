"use client";

import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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

  if (!isClient) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 border border-border/40 text-[10px] font-medium transition-colors ml-1" title={isOffline ? "Connexion perdue" : "Connecté"}>
      <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
      <span className={`hidden sm:inline-block ${isOffline ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
        {isOffline ? 'Hors-ligne' : 'En ligne'}
      </span>
    </div>
  );
}
