"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, ShieldAlert, Eye, EyeOff, Lock, ChevronDown, ArrowRight } from "lucide-react";
import { VirtualKeypad } from "@/components/auth/VirtualKeypad";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [pin, setPin] = useState("");
  
  const [showKeypad, setShowKeypad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [showPin, setShowPin] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus effect for PIN
  const handlePinFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Prevents standard keyboard on mobile
    if (pinInputRef.current) {
      pinInputRef.current.blur();
    }
    setShowKeypad(true);
  };

  const handleKeypadPress = (key: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + key);
      setIsError(false); // Reset error state on typing
    }
  };

  const handleKeypadDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setIsError(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!nom || !poste || !pin) {
      triggerError("Veuillez remplir tous les champs.");
      return;
    }

    if (pin.length < 6) {
      triggerError("Le code PIN doit contenir au moins 6 chiffres.");
      return;
    }

    setShowKeypad(false);
    setIsLoading(true);
    setIsError(false);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, poste, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion.');
      }
      
      // Success
      setIsLoading(false);
      setIsSuccess(true);
      
      // Routage 
      setTimeout(() => {
        router.push(data.redirect || '/dashboard');
      }, 1200);
      
    } catch (err: any) {
      setIsLoading(false);
      triggerError(err.message || "Erreur de connexion.");
    }
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsError(true);
    // Auto reset shake
    setTimeout(() => setIsError(false), 500);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white selection:bg-[#0B8F3A]/20 overflow-hidden">
      
      {/* LEFT SIDE : Branding & Illustration (Hidden on very small screens, stacked on tablets, split on desktop) */}
      <div className="relative hidden md:flex md:w-[45%] lg:w-[50%] bg-[#0B8F3A] flex-col justify-between p-10 lg:p-16 overflow-hidden text-white">
        {/* Background Gradients & Patterns */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#2FBF5B] to-transparent blur-[100px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[#065F25] to-transparent blur-[100px] opacity-80 pointer-events-none" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Top Content */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 relative rounded-2xl overflow-hidden bg-white shadow-xl flex items-center justify-center p-2">
            <Image src="/images/logo.png" alt="REX Logo" fill className="object-cover scale-110" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">REGIONALE EXPRESS<br/>VOYAGES SARL</h1>
          </div>
        </div>

        {/* Middle/Bottom Content */}
        <div className="relative z-10 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-[1.1] mb-6">
              L'excellence du <br/>
              <span className="text-green-200">transport urbain</span>
            </h2>
            <p className="text-green-50/80 text-lg lg:text-xl font-medium max-w-md leading-relaxed">
              Plateforme de gestion interne sécurisée. Accédez à vos outils quotidiens en un seul clic.
            </p>
          </motion.div>
        </div>
        
        {/* Decorative Element */}
        <div className="absolute bottom-16 right-16 z-0 opacity-20">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>

      {/* RIGHT SIDE : Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-8 lg:p-24 relative bg-slate-50 md:bg-white min-h-screen md:min-h-0">
        
        {/* Mobile Header (Shown only on small screens) */}
        <div className="md:hidden w-full max-w-[420px] flex items-center gap-3 mb-10 mt-8">
          <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-white shadow-md border border-slate-100 flex items-center justify-center p-1.5">
            <Image src="/images/logo.png" alt="REX Logo" fill className="object-cover scale-110" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">REGIONALE EXPRESS VOYAGES SARL</h1>
        </div>

        <motion.div 
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}} 
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          {/* Header Text */}
          <div className="mb-10 text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Bon retour 👋</h2>
            <p className="text-slate-500 font-medium">Veuillez entrer vos identifiants pour continuer.</p>
          </div>
          
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 bg-white md:bg-transparent rounded-3xl md:rounded-none shadow-xl md:shadow-none border md:border-none border-slate-100"
            >
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-[#0B8F3A]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Connexion réussie</h3>
              <p className="text-slate-500 flex items-center gap-2">
                Redirection en cours <Loader2 className="w-4 h-4 animate-spin" />
              </p>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-semibold border border-red-100 shadow-sm"
                >
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
                  {errorMessage}
                </motion.div>
              )}

              {/* Nom Field */}
              <div className="space-y-2.5">
                <Label htmlFor="nom" className="text-sm font-semibold text-slate-700">Identifiant (Nom Complet)</Label>
                <div className="relative group">
                  <Input 
                    id="nom" 
                    type="text" 
                    placeholder="Ex: HAROUNA MAMADOU" 
                    value={nom}
                    onChange={(e) => setNom(e.target.value.toUpperCase())}
                    className="h-14 rounded-2xl bg-white md:bg-slate-50 border-slate-200 focus-visible:ring-4 focus-visible:ring-[#0B8F3A]/10 focus-visible:border-[#0B8F3A] transition-all px-5 font-semibold text-slate-900 uppercase shadow-sm group-hover:border-slate-300"
                  />
                </div>
              </div>
              
              {/* Poste Field */}
              <div className="space-y-2.5">
                <Label htmlFor="poste" className="text-sm font-semibold text-slate-700">Rôle / Poste</Label>
                <div className="relative group">
                  <select 
                    id="poste"
                    value={poste}
                    onChange={(e) => setPoste(e.target.value)}
                    className="w-full h-14 rounded-2xl bg-white md:bg-slate-50 border-slate-200 focus:ring-4 focus:ring-[#0B8F3A]/10 focus:border-[#0B8F3A] transition-all px-5 font-semibold text-slate-900 appearance-none border outline-none shadow-sm group-hover:border-slate-300 cursor-pointer"
                  >
                    <option value="" disabled>Sélectionnez votre poste</option>
                    <option value="PDG">PDG</option>
                    <option value="DG">DG</option>
                    <option value="DGA">DGA</option>
                    <option value="CHEF_AGENCE">Chef d'agence</option>
                    <option value="COMPTABLE">Comptable</option>
                    <option value="CAISSIER">Caissier</option>
                    <option value="SECRETAIRE">Secrétaire</option>
                    <option value="AGENT">Agent de saisie</option>
                    <option value="AUTRE">Autre...</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* PIN Field */}
              <div className="space-y-2.5 relative">
                <div className="flex justify-between items-end">
                  <Label htmlFor="pin" className="text-sm font-semibold text-slate-700">Mot de passe (PIN)</Label>
                  <button 
                    type="button" 
                    className="text-xs font-semibold text-[#0B8F3A] hover:text-[#097a31] transition-colors"
                    onClick={() => {}}
                  >
                    Code oublié ?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input 
                    id="pin" 
                    ref={pinInputRef}
                    type={showPin ? "text" : "password"} 
                    inputMode="none" // Prevent mobile keyboard
                    placeholder="••••••" 
                    value={pin}
                    onFocus={handlePinFocus}
                    onChange={() => {}} // Controlled by keypad
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className={`h-14 rounded-2xl bg-white md:bg-slate-50 border-slate-200 focus-visible:ring-4 focus-visible:ring-[#0B8F3A]/10 focus-visible:border-[#0B8F3A] transition-all pl-12 pr-14 font-mono ${!showPin ? 'text-2xl tracking-[0.3em] font-black' : 'text-xl tracking-widest font-bold'} text-slate-900 caret-transparent shadow-sm group-hover:border-slate-300`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Virtual Keypad - Premium styling applied within existing component or wrapper */}
              <AnimatePresence>
                {showKeypad && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 sm:p-4 bg-slate-50 md:bg-white border border-slate-100 rounded-3xl shadow-inner md:shadow-sm">
                      <VirtualKeypad 
                        isOpen={showKeypad}
                        onKeyPress={handleKeypadPress}
                        onDelete={handleKeypadDelete}
                        onSubmit={handleSubmit}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl text-[15px] font-bold bg-[#111111] hover:bg-[#222222] text-white shadow-xl shadow-black/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Authentification...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Footer / Security Info */}
          <div className="mt-12 flex flex-col items-center justify-center gap-3 text-center pb-8 md:pb-0">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Connexion chiffrée de bout en bout</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              ERP System v1.0.0 • REX Voyage
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
