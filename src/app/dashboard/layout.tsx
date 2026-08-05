import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  Settings, 
  Menu,
  Bell,
  Building,
  Landmark,
  Tag,
  Users,
  Smartphone,
  Truck,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { RefreshButton } from "@/components/RefreshButton";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const CopilotWidget = dynamic(
  () => import("@/features/ai/CopilotWidget").then((mod) => mod.CopilotWidget)
);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Fetch real session user for profile display
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const payload = token ? await decryptSession(token) : null;

  const dbUser = payload ? await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { nom: true, prenom: true, role: true, photoUrl: true, agency: { select: { nom: true } } }
  }) : null;
  
  const userId = payload?.userId;

  const displayName = dbUser ? `${dbUser.prenom} ${dbUser.nom}` : "Utilisateur";
  const displayInitials = dbUser
    ? `${dbUser.prenom[0] ?? ""}${dbUser.nom[0] ?? ""}`.toUpperCase()
    : "?";
  const displayRole = dbUser?.role ?? "AGENT";
  const agencyName = dbUser?.agency?.nom ?? "";
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-md overflow-hidden relative border border-border shadow-sm">
            <Image src="/images/logo.png" alt="REX Logo" fill className="object-cover" />
          </div>
          <span className="tracking-tight">Dashboard</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <OfflineIndicator />
          <RefreshButton />
          {userId && <NotificationBell userId={userId} />}
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Menu principal" />}>
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col bg-background">
              <SheetHeader className="p-4 border-b border-border/40 text-left">
                <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md overflow-hidden relative border border-border shadow-sm">
                    <Image src="/images/logo.png" alt="REX Logo" fill className="object-cover" />
                  </div>
                  Navigation
                </SheetTitle>
              </SheetHeader>
              
              <div className="px-4 py-4 flex-shrink-0">
                <div className="p-2.5 bg-transparent border border-border/40 rounded-xl flex items-center gap-3">
                  {dbUser?.photoUrl ? (
                    <img src={dbUser.photoUrl} alt="Profil" className="w-7 h-7 rounded-full object-cover shrink-0 border border-primary/20 shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0 border border-primary/20 shadow-sm">
                      {displayInitials}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">{displayName}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{displayRole}{agencyName ? ` • ${agencyName}` : ""}</span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                <SheetClose>
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 text-foreground font-medium text-sm">
                    <LayoutDashboard size={16} /> Tableau de bord
                  </Link>
                </SheetClose>
                <SheetClose>
                  <Link href="/dashboard/expenses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                    <Wallet size={16} /> Dépenses
                  </Link>
                </SheetClose>
                <SheetClose>
                  <Link href="/dashboard/deposits" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                    <ArrowRightLeft size={16} /> Versements bancaires
                  </Link>
                </SheetClose>
                <SheetClose>
                  <Link href="/dashboard/recettes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                    <ArrowRightLeft size={16} className="rotate-90 text-primary" /> Recettes journalières
                  </Link>
                </SheetClose>
                {(displayRole === 'PDG' || displayRole === 'DG') && (
                  <>
                    <SheetClose>
                      <Link href="/dashboard/synthese-lignes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Activity size={16} className="text-primary" /> Synthèse Lignes
                      </Link>
                    </SheetClose>
                    
                    <div className="pt-4 pb-1">
                      <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Administration</p>
                    </div>
                    <SheetClose>
                      <Link href="/dashboard/agencies" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Building size={16} /> Agences
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link href="/dashboard/banks" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Landmark size={16} /> Banques
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link href="/dashboard/categories" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Tag size={16} /> Catégories
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link href="/dashboard/fournisseurs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Truck size={16} /> Fournisseurs
                      </Link>
                    </SheetClose>
                  </>
                )}
                {displayRole === 'PDG' && (
                  <>
                    <SheetClose>
                      <Link href="/dashboard/settings/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Users size={16} /> Utilisateurs
                      </Link>
                    </SheetClose>
                    <SheetClose>
                      <Link href="/dashboard/settings/logs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                        <Settings size={16} /> Journaux d'Audit
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>

              <div className="p-3 border-t border-border/40 space-y-1 mb-safe">
                <SheetClose>
                  <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm">
                    <Settings size={16} /> Paramètres
                  </Link>
                </SheetClose>
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-background h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden relative shadow-sm border border-border bg-white flex items-center justify-center">
            <Image src="/images/logo.png" alt="REX Logo" width={40} height={40} className="object-cover scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight text-[11px] text-foreground leading-tight">REGIONALE EXPRESS VOYAGE</span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Finance Portal</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="p-2.5 bg-transparent border border-border/40 hover:bg-muted/30 transition-colors rounded-xl flex items-center gap-3 cursor-pointer">
            {dbUser?.photoUrl ? (
              <img src={dbUser.photoUrl} alt="Profil" className="w-7 h-7 rounded-full object-cover shrink-0 border border-primary/20 shadow-sm" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0 border border-primary/20 shadow-sm">
                {displayInitials}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">{displayName}</span>
              <span className="text-[11px] text-muted-foreground font-medium">{displayRole}{agencyName ? ` • ${agencyName}` : ""}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 text-foreground font-medium text-sm hover-scale">
            <LayoutDashboard size={16} />
            Tableau de bord
          </Link>
          <Link href="/dashboard/expenses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
            <Wallet size={16} />
            Dépenses
          </Link>
          <Link href="/dashboard/deposits" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
            <ArrowRightLeft size={16} />
            Versements bancaires
          </Link>
          <Link href="/dashboard/recettes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
            <ArrowRightLeft size={16} className="rotate-90 text-primary" />
            Recettes journalières
          </Link>
          <Link href="/dashboard/synthese-lignes" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
            <Activity size={16} className="text-primary" />
            Synthèse Lignes
          </Link>
          {(displayRole === 'PDG' || displayRole === 'DG') && (
            <>
              <div className="pt-4 pb-1">
                <p className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Administration</p>
              </div>
              <Link href="/dashboard/agencies" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
                <Building size={16} />
                Agences
              </Link>
              <Link href="/dashboard/banks" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
                <Landmark size={16} />
                Banques
              </Link>
              <Link href="/dashboard/categories" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
                <Tag size={16} />
                Catégories
              </Link>
              <Link href="/dashboard/fournisseurs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
                <Truck size={16} />
                Fournisseurs
              </Link>
            </>
          )}
          {displayRole === 'PDG' && (
            <>
              <Link href="/dashboard/settings/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
                <Users size={16} />
                Utilisateurs
              </Link>
              <Link href="/dashboard/settings/logs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
                <Settings size={16} />
                Journaux d'Audit
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border/40 space-y-1">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium text-sm hover-scale">
            <Settings size={16} />
            Paramètres
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 items-center justify-end px-8 border-b border-border/40 glass sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <RefreshButton />
            {userId && <NotificationBell userId={userId} />}
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
        
        {/* AI Copilot Widget (Global to Dashboard) */}
        <CopilotWidget />
      </main>
    </div>
  );
}
