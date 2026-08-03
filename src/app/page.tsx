"use client";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Clock, CreditCard, CheckCircle2, Phone, Menu, X, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants, AnimatePresence, useInView } from "framer-motion";
import { landingConfig } from "@/config/landing";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  React.useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function CorporateLandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all">
        <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 relative items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group-hover:scale-105 transition-transform duration-300">
              <Image src="/images/logo.png" alt="REX Logo" fill className="object-cover scale-110" />
            </div>
            <span className="text-[11px] xs:text-sm sm:text-xl font-black tracking-tight text-slate-900 leading-tight">
              REGIONALE EXPRESS<br className="sm:hidden"/> VOYAGES SARL
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="#fidelite" className="hover:text-emerald-600 transition-colors">Fidélité</Link>
            <Link href="#agences" className="hover:text-emerald-600 transition-colors">Agences</Link>
            <Link href="#services" className="hover:text-emerald-600 transition-colors">Services</Link>
            <Link href="#apropos" className="hover:text-emerald-600 transition-colors">À Propos</Link>
            <Link href="#contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="block">
              <Button variant="default" className="rounded-full px-3 sm:px-6 h-8 sm:h-10 text-[11px] sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                Connexion
              </Button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-700 hover:text-[#0B8F3A] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="flex flex-col px-6 py-6 gap-6">
                <Link href="#fidelite" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-[#0B8F3A]">Fidélité</Link>
                <Link href="#agences" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-[#0B8F3A]">Agences</Link>
                <Link href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-[#0B8F3A]">Services</Link>
                <Link href="#apropos" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-[#0B8F3A]">À Propos</Link>
                <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-600 hover:text-[#0B8F3A]">Contact</Link>
                
                <div className="pt-4 border-t border-slate-100">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl h-12 bg-[#0B8F3A] hover:bg-[#0B8F3A]/90 text-white shadow-lg">
                      Connexion Espace Interne
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 w-full pt-20">
        
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
            <Image src="/images/hero-bg.jpg" alt="Flotte de bus REGIONALE EXPRESS VOYAGES SARL" fill className="object-cover object-center" priority />
            <div className="absolute inset-0 bg-black/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
          
          <div className="container mx-auto px-6 relative z-10 max-w-7xl mt-12 lg:mt-0">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <motion.div variants={fadeUp} className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-emerald-300 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                L'excellence du transport au Cameroun
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-6 drop-shadow-lg">
                Bienvenue chez <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 drop-shadow-md">REGIONALE EXPRESS VOYAGES SARL</span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="max-w-2xl text-lg md:text-xl font-medium leading-relaxed mb-10 text-slate-200 drop-shadow-md">
                Votre partenaire de confiance pour le transport interurbain sécurisé au Cameroun.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="#services">
                  <Button size="lg" className="rounded-full w-full sm:w-auto h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:scale-105 transition-all">
                    Découvrir nos services
                  </Button>
                </Link>
                <Link href="#agences">
                  <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto h-14 px-8 text-base border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm font-semibold hover:scale-105 transition-all">
                    Trouver une agence
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* PROGRAMME FIDELITE (Apple Wallet Style) */}
        <section id="fidelite" className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Virtual Card 3D */}
              <motion.div variants={fadeUp} className="flex justify-center lg:justify-start perspective-1000">
                <div className="relative w-full max-w-[400px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-emerald-400 to-green-700 shadow-2xl p-6 flex flex-col justify-between overflow-hidden transform transition-transform hover:scale-105 hover:rotate-2 duration-500 border border-white/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden relative">
                      <Image src="/images/logo.png" alt="Logo" fill className="object-cover scale-150" />
                    </div>
                    <span className="text-white/90 font-bold uppercase tracking-widest text-sm">REX Elite</span>
                  </div>
                  
                  <div className="z-10 mt-8">
                    <div className="flex gap-2 text-white/80 font-mono text-xl tracking-widest mb-2">
                      <span>••••</span> <span>••••</span> <span>••••</span> <span>1234</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">Carnet de Régularité</p>
                        <p className="font-semibold text-lg tracking-wide">Voyageur Régulier</p>
                      </div>
                      <CreditCard className="w-8 h-8 text-white/50" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={staggerContainer} className="flex flex-col items-start text-left">
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black mb-6">Carnet de Régularité</motion.h2>
                <motion.p variants={fadeUp} className="text-xl text-slate-300 font-medium leading-relaxed mb-10">
                  Souscrivez à votre Carnet de Régularité et bénéficiez de nombreux avantages ainsi que de voyages gratuits selon votre fréquence de déplacement.
                </motion.p>
                
                <div className="flex flex-col gap-6 w-full mb-10">
                  <motion.div variants={fadeUp} className="flex items-start gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">Embarquement prioritaire</h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">Sans file d'attente, même pendant les périodes de forte affluence.</p>
                    </div>
                  </motion.div>
                  <motion.div variants={fadeUp} className="flex items-start gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">Billets gratuits</h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">Voyages offerts selon votre fréquence de déplacement.</p>
                    </div>
                  </motion.div>
                  <motion.div variants={fadeUp} className="flex items-start gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">Réservation à distance</h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">Gagnez du temps en préparant votre embarquement où que vous soyez.</p>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div variants={fadeUp}>
                  <a href={landingConfig.fidelite.whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="rounded-full h-14 px-8 text-base bg-white hover:bg-slate-100 text-slate-900 font-bold hover:scale-105 transition-transform">
                      Découvrir notre programme
                    </Button>
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-6">Nos Services</motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 font-medium">L'exigence de la qualité pour chaque kilomètre parcouru.</motion.p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {landingConfig.services.map((feature, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1 } } } as Variants} 
                  className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-6 text-emerald-600">
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 font-medium leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SUIVI DES COLIS */}
        {/* NOS AGENCES */}
        <section id="agences" className="py-24 bg-[#F9FAFB] border-y border-slate-200">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-16">
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-6">Nos Agences Officielles</motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 font-medium max-w-2xl">Un réseau stratégique pour vous servir au plus près.</motion.p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {landingConfig.agencies.map((agence, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { delay: i * 0.1 } } } as Variants} 
                  className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <MapPin size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{agence.name}</h3>
                  </div>
                  <div className="space-y-3 text-slate-600 font-medium text-sm mb-6">
                    <p className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /> {agence.phone}</p>
                    <p className="flex items-center gap-3"><Clock size={16} className="text-slate-400" /> {agence.hours}</p>
                  </div>
                  <a href={agence.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-slate-50 font-semibold group-hover:border-emerald-200 group-hover:text-emerald-700 transition-colors">
                      📍 Voir sur Google Maps
                    </Button>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* NOS CHIFFRES */}
        <section className="py-24 bg-slate-900 text-white relative">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                { val: 7, suffix: "", label: "Années d'expérience" },
                { val: 50, suffix: "+", label: "Véhicules" },
                { val: 85, suffix: "%", label: "Satisfaction client" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center justify-center p-4">
                  <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-green-300 mb-2">
                    <AnimatedCounter end={stat.val} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-24 bg-[#F9FAFB] border-t border-slate-200">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center max-w-3xl mx-auto mb-16">
              <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-6">Contactez-nous</motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-slate-600 font-medium">Nous sommes à votre disposition pour toute information.</motion.p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="grid lg:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Contact Général</h3>
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Adresse</h4>
                        <p className="text-slate-600">{landingConfig.contact.address}</p>
                        <p className="text-sm text-slate-500">{landingConfig.contact.hours}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Email</h4>
                        <p className="text-slate-600 break-all">{landingConfig.contact.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <a href={landingConfig.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="w-full h-14 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-base hover:scale-[1.02] transition-transform flex items-center gap-2">
                        <Phone size={18} /> Discuter sur WhatsApp
                      </Button>
                    </a>
                    <a href={`mailto:${landingConfig.contact.email}`}>
                      <Button size="lg" variant="outline" className="w-full h-14 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-base hover:scale-[1.02] transition-transform flex items-center gap-2">
                        Envoyer un email
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Appeler une Agence</h3>
                  <div className="grid sm:grid-cols-1 gap-4">
                    {landingConfig.agencies.map((agence, idx) => (
                      <a key={idx} href={`tel:${agence.phone.split('/')[0].replace(/[^0-9+]/g, '')}`} className="group block bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{agence.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">{agence.phone}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Phone size={18} />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* A PROPOS & VALEURS */}
        <section id="apropos" className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <motion.h2 variants={fadeUp} className="text-4xl font-black text-slate-900 mb-8">À Propos de Nous</motion.h2>
                <div className="space-y-6 text-lg text-slate-600 font-medium leading-relaxed">
                  <motion.p variants={fadeUp}>
                    Fondée avec la vision de révolutionner le transport interurbain au Cameroun, REGIONALE EXPRESS VOYAGES SARL est devenue la référence en matière de fiabilité et de confort.
                  </motion.p>
                  <motion.p variants={fadeUp}>
                    Notre mission est simple : connecter les villes et rapprocher les familles avec un niveau de sécurité et de service inégalé sur le marché.
                  </motion.p>
                </div>
              </motion.div>
              
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <motion.h2 variants={fadeUp} className="text-2xl font-black text-slate-900 mb-8">Nos Valeurs Fondamentales</motion.h2>
                <div className="grid grid-cols-2 gap-4">
                  {["Sécurité", "Respect", "Professionnalisme", "Innovation", "Confiance", "Ponctualité"].map((valeur, i) => (
                    <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-bold text-slate-800">{valeur}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ERP MENTION (Discreet) */}
        <section className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Notre entreprise utilise un système moderne de gestion permettant la traçabilité, la gestion financière, la sécurité, la transparence et le suivi rigoureux des opérations.
            </p>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full bg-slate-900 border-t border-white/10 pt-20 pb-10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-white">
                  <Image src="/images/logo.png" alt="REX Logo" fill className="object-cover scale-110" />
                </div>
                <span className="text-lg font-black text-white">REGIONALE EXPRESS VOYAGES SARL</span>
              </div>
              <p className="text-slate-400 font-medium max-w-sm">
                Votre satisfaction est notre priorité.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-sm">Entreprise</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="#apropos" className="hover:text-emerald-400 transition-colors">À Propos</Link></li>
                <li><Link href="#agences" className="hover:text-emerald-400 transition-colors">Nos Agences</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Nous contacter</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-sm">Légal</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Mentions légales</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Conditions générales</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              © {new Date().getFullYear()} REGIONALE EXPRESS VOYAGES SARL. Tous droits réservés.
            </p>
            <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-emerald-500 transition-colors">
              Connexion ERP
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
