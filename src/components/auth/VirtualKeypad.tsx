"use client";

import { motion } from "framer-motion";
import { Delete, Check } from "lucide-react";
import { useEffect } from "react";

interface VirtualKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  isOpen: boolean;
}

export function VirtualKeypad({ onKeyPress, onDelete, onSubmit, isOpen }: VirtualKeypadProps) {
  // Optionnel : permettre aussi l'usage du clavier physique quand le keypad est ouvert
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        onKeyPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        onDelete();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onKeyPress, onDelete, onSubmit]);

  if (!isOpen) return null;

  const buttons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full mx-auto bg-slate-50/40 p-4 rounded-3xl select-none touch-none"
    >
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {buttons.map((num) => (
          <motion.button
            key={num}
            type="button"
            onClick={(e) => { e.preventDefault(); onKeyPress(num); }}
            whileHover={{ scale: 1.05, backgroundColor: '#ffffff', y: -2 }}
            whileTap={{ scale: 0.92, backgroundColor: '#f1f5f9', y: 0 }}
            className="h-14 md:h-16 rounded-2xl bg-white text-slate-700 font-medium text-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center transition-colors touch-manipulation"
          >
            {num}
          </motion.button>
        ))}
        
        <motion.button
          type="button"
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          whileHover={{ scale: 1.05, backgroundColor: '#fee2e2', y: -2 }}
          whileTap={{ scale: 0.92, backgroundColor: '#fecaca', y: 0 }}
          className="h-14 md:h-16 rounded-2xl bg-red-50/80 text-red-500 flex items-center justify-center shadow-sm border border-red-100 transition-colors touch-manipulation"
        >
          <Delete size={26} strokeWidth={2.5} />
        </motion.button>
        
        <motion.button
          type="button"
          onClick={(e) => { e.preventDefault(); onKeyPress("0"); }}
          whileHover={{ scale: 1.05, backgroundColor: '#ffffff', y: -2 }}
          whileTap={{ scale: 0.92, backgroundColor: '#f1f5f9', y: 0 }}
          className="h-14 md:h-16 rounded-2xl bg-white text-slate-700 font-medium text-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-center transition-colors touch-manipulation"
        >
          0
        </motion.button>
        
        <motion.button
          type="button"
          onClick={(e) => { e.preventDefault(); onSubmit(); }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.92, y: 0 }}
          className="h-14 md:h-16 rounded-2xl bg-gradient-to-b from-[#0B8F3A] to-[#097a31] text-white flex items-center justify-center shadow-lg shadow-green-600/25 border border-green-700/20 touch-manipulation relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <Check size={32} strokeWidth={2.5} className="relative z-10" />
        </motion.button>
      </div>
    </motion.div>
  );
}
