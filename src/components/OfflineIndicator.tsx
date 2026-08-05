"use client";

import { useState, useEffect, useRef } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isOfflineRef = useRef(false);

  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  useEffect(() => {
    setIsClient(true);
    
    const checkConnection = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
        return;
      }
      try {
        // Ping ultra-léger pour vérifier la vraie connexion internet
        const res = await fetch('/favicon.ico?_t=' + Date.now(), { 
          method: 'HEAD', 
          cache: 'no-store' 
        });
        setIsOffline(!res.ok);
      } catch (error) {
        setIsOffline(true);
      }
    };

    // Check initial state
    checkConnection();

    // Active polling toutes les 5 secondes
    const interval = setInterval(checkConnection, 5000);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => checkConnection();

    const handleGlobalClick = (e: MouseEvent) => {
      if (!isOfflineRef.current) return;
      
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = anchor.href;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("visibilitychange", checkConnection);
    window.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("visibilitychange", checkConnection);
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
