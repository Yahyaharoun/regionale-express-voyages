import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Bot, Layers, ShieldCheck, MapPin, Building2, TerminalSquare, Info, WifiOff, Download, FileText, History } from "lucide-react";
import { CHANGELOG_DATA } from "@/config/changelog";
export function AboutTab() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. NOM DU PRODUIT & 2. DESCRIPTION */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-2xl border border-border/40 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <TerminalSquare className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">REGIONALE EXPRESS VOYAGES SARL ERP</h1>
          </div>
          <div className="space-y-3">
            <h2 className="font-semibold text-lg text-foreground">À propos de REGIONALE EXPRESS VOYAGES SARL ERP</h2>
            <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
              REGIONALE EXPRESS VOYAGES SARL ERP est une plateforme professionnelle de gestion financière, administrative et opérationnelle développée exclusivement pour <strong>REGIONALE EXPRESS VOYAGES SARL</strong>.
            </p>
            <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
              Cette solution centralise l'ensemble des opérations de l'entreprise en temps réel afin d'améliorer la gestion financière, le suivi des agences, le contrôle des recettes, la gestion des dépenses, les versements bancaires, les fournisseurs, les utilisateurs, les objectifs financiers et la prise de décision.
            </p>
            <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
              L'application est conçue selon une architecture moderne, sécurisée et évolutive, fonctionnant aussi bien en ligne qu'en mode Offline First grâce à une synchronisation automatique des données. Elle offre aux dirigeants une vision globale et en temps réel des performances de chaque agence ainsi que de l'ensemble du réseau.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground">Version</span>
            <Badge variant="default" className="font-semibold">1.0.0</Badge>
          </div>
          <div className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground">Édition</span>
            <span className="font-medium text-foreground">Enterprise</span>
          </div>
          <div className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground">Statut</span>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">Production</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. OBJECTIFS DU LOGICIEL */}
        <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card/50">
          <CardHeader className="border-b border-border/10 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Objectifs du système</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm text-muted-foreground">
              {[
                "Centraliser les opérations financières des agences",
                "Gérer les recettes journalières par ligne et par agence",
                "Calculer automatiquement le Net en Caisse",
                "Suivre les dépenses validées",
                "Gérer les achats auprès des fournisseurs",
                "Suivre les dettes fournisseurs",
                "Gérer les versements bancaires",
                "Suivre les objectifs bancaires",
                "Superviser les performances des lignes et agences",
                "Produire automatiquement les rapports financiers",
                "Assurer une traçabilité complète via le journal d'audit",
                "Contrôler les accès selon les rôles utilisateurs",
                "Synchroniser les données en temps réel",
                "Fonctionner en mode Offline First",
                "Assister les utilisateurs grâce au Chatbot IA intégré"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 4. FONCTIONNALITÉS PRINCIPALES */}
        <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card/50">
          <CardHeader className="border-b border-border/10 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Fonctionnalités Principales</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Gestion financière</h4>
                <div className="flex flex-wrap gap-2">
                  {["Dépenses", "Recettes journalières", "Versements bancaires", "Synthèse financière", "Net en caisse", "Objectifs bancaires"].map((module, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 font-normal bg-muted/50 text-xs hover:bg-muted/80">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Gestion opérationnelle</h4>
                <div className="flex flex-wrap gap-2">
                  {["Agences", "Lignes", "Fournisseurs", "Banques", "Catégories", "Utilisateurs"].map((module, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 font-normal bg-muted/50 text-xs hover:bg-muted/80">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">Analyse décisionnelle</h4>
                <div className="flex flex-wrap gap-2">
                  {["Tableaux de bord", "Graphiques interactifs", "Statistiques", "Rapports PDF", "Journal d'audit"].map((module, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 font-normal bg-muted/50 text-xs hover:bg-muted/80">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 8. ENTREPRISE */}
            <div className="mt-8 pt-5 border-t border-border/10">
              <h4 className="flex items-center gap-2 text-sm font-semibold mb-4 text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Agences Prises en Charge
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/60" /> Yaoundé Mvan</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/60" /> Yaoundé Mimboman</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/60" /> Mbalmayo</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/60" /> Ayos</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/60" /> Akonolinga</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. ARCHITECTURE TECHNIQUE & 6. GESTION DES RÔLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card/50">
          <CardHeader className="border-b border-border/10 pb-4">
            <div className="flex items-center gap-2">
              <TerminalSquare className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-lg">Architecture & Technologie</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Frontend</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Next.js 14+</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> TypeScript</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Tailwind CSS</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> React</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Recharts</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Backend & Sécurité</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Supabase & PostgreSQL</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> API sécurisées</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Authentification & RBAC</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> RLS Supabase</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Journal d'audit</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Synchronisation</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Dexie.js & IndexedDB</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Mode Offline First</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Progressive Web App</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Notifications</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Firebase Cloud Messaging</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-indigo-500 rounded-full" /> Alertes en temps réel</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. GESTION DES RÔLES */}
        <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card/50">
          <CardHeader className="border-b border-border/10 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-lg">Sécurité & Rôles</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-muted/30 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-foreground">PDG</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed"><strong>Accès total :</strong> Gestion complète, Création, Modification, Suppression, Validation, Paramètres, Utilisateurs, Fournisseurs, Banques, Catégories, Agences, Rapports, Audit, IA.</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-foreground">DG</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed"><strong>Accès complet à l'exploitation :</strong> Validation/Rejet, Dépenses, Versements, Recettes, Synthèses, Rapports, Fournisseurs. <br/><span className="text-amber-600 dark:text-amber-500 font-medium">Le DG ne peut pas : créer, modifier, supprimer ou suspendre un utilisateur.</span></p>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-foreground">Agent de saisie</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed"><strong>Accès limité :</strong> Peut uniquement créer des Dépenses, Versements bancaires, Recettes journalières et consulter ses propres données ou le tableau de bord.<br/><span className="text-amber-600 dark:text-amber-500 font-medium">Ne peut jamais modifier, supprimer, valider ou gérer des paramètres globaux. Toutes ses saisies doivent être validées ou rejetées par le PDG ou le DG.</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IA */}
        <Card className="border border-indigo-500/20 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/5 via-card to-card relative h-full">
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
          <CardHeader className="border-b border-indigo-500/10 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-indigo-500">Intelligence Artificielle</CardTitle>
                <CardDescription className="text-xs">Chatbot IA intégré au système</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 relative z-10">
            <ul className="text-sm text-muted-foreground space-y-4">
              <li className="flex items-center gap-3"><div className="p-1.5 bg-indigo-500/10 rounded-full"><CheckCircle2 className="w-4 h-4 text-indigo-500" /></div> Assistance utilisateur en langage naturel</li>
              <li className="flex items-center gap-3"><div className="p-1.5 bg-indigo-500/10 rounded-full"><CheckCircle2 className="w-4 h-4 text-indigo-500" /></div> Réponses contextuelles basées sur les données financières</li>
              <li className="flex items-center gap-3"><div className="p-1.5 bg-indigo-500/10 rounded-full"><CheckCircle2 className="w-4 h-4 text-indigo-500" /></div> Aide à l'utilisation et la navigation dans l'ERP</li>
              <li className="flex items-center gap-3"><div className="p-1.5 bg-indigo-500/10 rounded-full"><CheckCircle2 className="w-4 h-4 text-indigo-500" /></div> Mode analytique (bilans, synthèses et audit en temps réel)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Licence & Copyright */}
        <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card/50 h-full flex flex-col">
          <CardHeader className="border-b border-border/10 pb-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Licence & Informations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-sm text-muted-foreground flex flex-col flex-grow">
            <div className="grid grid-cols-[140px_1fr] gap-y-4 gap-x-2 flex-grow">
              <div className="font-semibold text-foreground">Développé pour :</div>
              <div className="text-primary font-medium">REGIONALE EXPRESS VOYAGES SARL</div>
              
              <div className="font-semibold text-foreground">Secteur :</div>
              <div>Transport interurbain de voyageurs</div>
              
              <div className="font-semibold text-foreground">Pays :</div>
              <div>Cameroun</div>
              
              <div className="font-semibold text-foreground">Architecture :</div>
              <div>ERP Web + PWA</div>
              
              <div className="font-semibold text-foreground">Mode :</div>
              <div>Offline First</div>
              
              <div className="font-semibold text-foreground">Licence :</div>
              <div className="leading-tight">Usage interne exclusivement réservé à REGIONALE EXPRESS VOYAGES SARL</div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border/20 text-xs font-medium text-center text-slate-500">
              © 2026 REGIONALE EXPRESS VOYAGES SARL.<br/>
              Tous droits réservés.<br/>
              <span className="mt-1 block">ERP développé exclusivement pour un usage interne.</span>
            </div>
            
            <div className="mt-6 flex justify-center">
              <a href="/manuel-utilisateur.pdf" download className="w-full">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 w-4 h-4" />
                  Télécharger le Manuel Utilisateur
                  <Download className="ml-2 w-3 h-3 text-muted-foreground" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHANGELOG */}
      <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card/50">
        <CardHeader className="border-b border-border/10 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Historique des versions (Changelog)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {CHANGELOG_DATA.map((entry, idx) => (
            <div key={idx} className="relative pl-6 sm:pl-8 py-2">
              <div className="absolute left-0 top-3 w-3 h-3 bg-primary rounded-full ring-4 ring-primary/20" />
              {idx !== CHANGELOG_DATA.length - 1 && (
                <div className="absolute left-[5px] top-6 bottom-[-24px] w-0.5 bg-border/40" />
              )}
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge variant={idx === 0 ? "default" : "secondary"}>v{entry.version}</Badge>
                <span className="text-xs text-muted-foreground font-medium">{entry.date}</span>
              </div>
              <h4 className="text-sm font-bold text-foreground mb-2">{entry.title}</h4>
              <ul className="space-y-1">
                {entry.changes.map((change, cIdx) => (
                  <li key={cIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="leading-relaxed">{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
