"use client";

import { useEffect, useState } from "react";

interface DynamicGreetingProps {
  name: string;
}

export function DynamicGreeting({ name }: DynamicGreetingProps) {
  const [greeting, setGreeting] = useState<{ text: string; emoji: string }>({
    text: "Bonjour 👋",
    emoji: "😎"
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting({ text: "Bonjour 👋", emoji: "😎" });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ text: "Bon après-midi 👋", emoji: "😁" });
    } else {
      setGreeting({ text: "Bonsoir 👋", emoji: "🌙" });
    }
  }, []);

  // Pour éviter l'erreur d'hydratation, on retourne une version statique (matin par défaut) avant le montage
  if (!mounted) {
    return (
      <div className="flex flex-col max-w-full">
        <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-foreground truncate">
          Bonjour 👋 {name}, bon retour 😎
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-full">
      <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-foreground truncate">
        {greeting.text} {name}, bon retour {greeting.emoji}
      </h1>
    </div>
  );
}
