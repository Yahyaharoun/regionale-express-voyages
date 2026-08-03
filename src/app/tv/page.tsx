import { getPDGDashboardStats, getChartData } from "@/actions/dashboardActions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TVDashboardClient } from "./TVDashboardClient";
import Image from "next/image";

export default async function TVDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId }
  });

  // Only PDG/DG should have access to TV dashboard
  if (dbUser?.role !== 'PDG' && dbUser?.role !== 'DG' && dbUser?.role !== 'DGA') {
    redirect('/dashboard');
  }

  const [pdgStats, chartData] = await Promise.all([
    getPDGDashboardStats(),
    getChartData()
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-20 border-b border-border/40 bg-card/50 backdrop-blur-md flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Image src="/images/rex-logo-v4.png" alt="REX" width={60} height={60} className="object-contain" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">REGIONALE EXPRESS VOYAGE</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Dashboard Global en Temps Réel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-muted-foreground font-medium">Mode Affichage Public</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-8">
        <TVDashboardClient stats={pdgStats} chartData={chartData} />
      </main>
    </div>
  );
}
