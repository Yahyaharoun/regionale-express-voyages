"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useCopy() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Copié dans le presse-papiers");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  return { isCopied, copyToClipboard };
}
