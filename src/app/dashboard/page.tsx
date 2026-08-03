import { getOperations } from "@/actions/operationActions";
import { getDashboardStats, getPDGDashboardStats, getChartData } from "@/actions/dashboardActions";
import { getSyntheseLignesData } from "@/actions/syntheseActions";
import { getBanks } from "@/actions/bankActions";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { decryptSession } from "@/lib/auth";
import nextDynamic from "next/dynamic";
import { DynamicGreeting } from "@/components/DynamicGreeting";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PDGDashboard = nextDynamic(() => import('./components/PDGDashboard').then(mod => mod.PDGDashboard), { 
  loading: () => <div className="animate-pulse h-[600px] bg-muted/20 rounded-xl" /> 
});
const AgentDashboard = nextDynamic(() => import('./components/AgentDashboard').then(mod => mod.AgentDashboard), {
  loading: () => <div className="animate-pulse h-[600px] bg-muted/20 rounded-xl" />
});

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const period = searchParams.period || "MOIS";
  const bankId = searchParams.bankId || "ALL";
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const payload = token ? await decryptSession(token) : null;

  const dbUser = payload ? await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { agency: true }
  }) : null;

  const userName = dbUser?.prenom ?? "Utilisateur";
  const agencyName = dbUser?.agency?.nom ?? "votre agence";
  const role = dbUser?.role ?? "AGENT";

  // Dashboard Router logic
  const isExecutive = role === "PDG" || role === "DG" || role === "DGA" || role === "AGENT";

  if (isExecutive) {
    // Load data for PDG / DG / Agent Dashboard
    // If user is AGENT, we filter by their agencyId
    const targetAgencyId = role === "AGENT" ? (dbUser?.agencyId ?? undefined) : undefined;

    const [pdgStats, chartData, banksResult, syntheseRes] = await Promise.all([
      getPDGDashboardStats(period, bankId, searchParams.from, searchParams.to, targetAgencyId),
      getChartData(period, bankId, searchParams.from, searchParams.to, targetAgencyId),
      getBanks(),
      getSyntheseLignesData(period, searchParams.from, searchParams.to)
    ]);
    const banks = banksResult?.data || [];
    const syntheseData = syntheseRes?.data || null;
    
    return (
      <div className="space-y-6">
        <div>
          <DynamicGreeting name={userName} />
          <p className="text-sm text-muted-foreground mt-1 font-medium">Voici le rapport financier de {role === "AGENT" ? agencyName : "REGIONALE EXPRESS VOYAGE"}.</p>
        </div>
        <PDGDashboard stats={pdgStats} chartData={chartData} period={period} bankId={bankId} banks={banks} syntheseData={syntheseData} />
      </div>
    );
  } else {
    // Load data for other roles if they exist
    const [recentResult, stats] = await Promise.all([
      getOperations(0, 5),
      dbUser?.agencyId
        ? getDashboardStats(dbUser.agencyId)
        : Promise.resolve({ pendingCount: 0, pendingAmount: 0, draftCount: 0, rejectedCount: 0 }),
    ]);

    const operations = recentResult?.data ?? [];
    
    return (
      <AgentDashboard 
        userName={userName} 
        agencyName={agencyName} 
        stats={stats} 
        operations={operations} 
      />
    );
  }
}
