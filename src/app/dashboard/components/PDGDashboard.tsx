"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Target, BarChart3, Activity, PieChart as PieChartIcon, Building, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { PDGStats } from "@/actions/dashboardActions";
import { formatToMillions, formatCurrencyAxis, formatYAxis } from "@/lib/formatters";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface PDGDashboardProps {
  stats: PDGStats;
  chartData: {
    expensesByCategory: { name: string, value: number }[];
    expensesByAgency: { name: string, value: number }[];
    depositsByBank: { name: string, value: number }[];
    recettesByAgency?: { name: string, value: number }[];
    evolution: { month: string, revenues: number, depenses: number, recettes?: number }[];
    objectiveEvolution?: { month: string, objectif: number, versements: number }[];
    banksStats?: { nom: string, objectif: number, atteint: number, restant: number, pourcentage: number, evolution: number, statut: string }[];
    globalBankStats?: { objectif: number, atteint: number, restant: number, pourcentage: number, evolution: number };
  };
  period?: string;
  bankId?: string;
  banks?: any[];
  syntheseData?: any;
}

// Couleurs officielles REX (Sobres: Vert, Noir, Gris)
const REX_GREEN = "#10b981"; // emerald-500
const REX_DARK = "#18181b"; // zinc-900
const REX_GRAY = "#71717a"; // zinc-500

const COLORS = [REX_GREEN, REX_DARK, '#3f3f46', '#52525b', '#71717a', '#a1a1aa'];

const EvolutionBadge = ({ value }: { value: number }) => {
  if (value === 0 || isNaN(value)) return null;
  const isPositive = value > 0;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'}`}>
      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
};

export function PDGDashboard({ stats, chartData, period = "MONTH", bankId = "ALL", banks = [], syntheseData }: PDGDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialFrom = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const initialTo = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo,
  });

  const handleFilterChange = (type: 'period' | 'bank', val: string | null) => {
    if (!val) return;
    const params = new URLSearchParams(window.location.search);
    if (type === 'period') params.set('period', val);
    if (type === 'bank') params.set('bankId', val);
    if (type === 'period') {
      params.delete('from');
      params.delete('to');
      setDate(undefined);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  useEffect(() => {
    if (date?.from && date?.to) {
      const params = new URLSearchParams(window.location.search);
      params.set("from", format(date.from, "yyyy-MM-dd"));
      params.set("to", format(date.to, "yyyy-MM-dd"));
      router.push(`/dashboard?${params.toString()}`);
    }
  }, [date, router]);

  // Evolutions
  const l = chartData.evolution.length;
  let revEvo = 0, expEvo = 0, theEvo = 0, recEvo = 0;
  if (l >= 2) {
    const last = chartData.evolution[l - 1];
    const prev = chartData.evolution[l - 2];
    if (prev.revenues > 0) revEvo = ((last.revenues - prev.revenues) / prev.revenues) * 100;
    if (prev.depenses > 0) expEvo = ((last.depenses - prev.depenses) / prev.depenses) * 100;

    let recEvo = 0;
    if (prev.recettes && prev.recettes > 0) recEvo = (((last.recettes || 0) - prev.recettes) / prev.recettes) * 100;

    const lastThe = last.revenues - last.depenses;
    const prevThe = prev.revenues - prev.depenses;
    if (prevThe !== 0) {
      theEvo = ((lastThe - prevThe) / Math.abs(prevThe)) * 100;
    }
  }

  let objEvo = 0;
  if (chartData.objectiveEvolution && chartData.objectiveEvolution.length >= 2) {
    const lObj = chartData.objectiveEvolution.length;
    const last = chartData.objectiveEvolution[lObj - 1];
    const prev = chartData.objectiveEvolution[lObj - 2];
    const lastProgress = last.objectif > 0 ? (last.versements / last.objectif) * 100 : 0;
    const prevProgress = prev.objectif > 0 ? (prev.versements / prev.objectif) * 100 : 0;
    if (prevProgress > 0) objEvo = ((lastProgress - prevProgress) / prevProgress) * 100;
  }

  const PremiumTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border shadow-xl rounded-xl p-3 max-w-[200px]">
          <p className="font-semibold text-sm text-foreground mb-2">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground font-medium">{entry.name}</span>
                </div>
                <span className="font-semibold">{formatToMillions(Number(entry.value))}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-0">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Aperçu Financier</h2>
          <p className="text-sm text-muted-foreground mt-1">Suivez les performances de l'entreprise en temps réel.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={bankId} onValueChange={(val) => handleFilterChange('bank', val)}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background border-border/50 shadow-sm rounded-xl h-10 transition-all hover:bg-muted/30">
              <span className="truncate font-medium text-sm">
                {bankId === "ALL" ? "Toutes les banques" : banks?.find(b => b.id === bankId)?.nom || "Sélectionner"}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border-border/50">
              <SelectItem value="ALL">Toutes les banques</SelectItem>
              {banks.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={period} onValueChange={(val) => handleFilterChange('period', val)}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background border-border/50 shadow-sm rounded-xl h-10 transition-all hover:bg-muted/30">
                <SelectValue placeholder="Période" className="font-medium text-sm" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-border/50">
                <SelectItem value="JOUR">Jour</SelectItem>
                <SelectItem value="SEMAINE">Semaine</SelectItem>
                <SelectItem value="MOIS">Mois</SelectItem>
                <SelectItem value="ANNEE">Année</SelectItem>
                <SelectItem value="TOUT">Tout</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="hidden md:block">
              <DatePickerWithRange 
                date={date} 
                setDate={setDate} 
                className="bg-background border-border/50 rounded-xl h-10 hover:bg-muted/30 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        
        {/* Solde Théorique */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" /> Solde Théorique
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions(stats.theoreticalBalance)}
                </div>
              </div>
              <EvolutionBadge value={theEvo} />
            </div>
            <div className="mt-4 h-[40px] w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.evolution.slice(-6)}>
                  <defs>
                    <linearGradient id="sparkThe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={REX_GREEN} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={REX_GREEN} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={(d) => d.revenues - d.depenses} stroke={REX_GREEN} strokeWidth={2} fill="url(#sparkThe)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Versements */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Versements
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions(stats.revenueMonth)}
                </div>
              </div>
              <EvolutionBadge value={revEvo} />
            </div>
            <div className="mt-4 h-[40px] w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.evolution.slice(-6)}>
                  <defs>
                    <linearGradient id="sparkRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={REX_GREEN} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={REX_GREEN} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="revenues" stroke={REX_GREEN} strokeWidth={2} fill="url(#sparkRev)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dépenses */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-zinc-500" /> Dépenses
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions(stats.expenseMonth)}
                </div>
              </div>
              <EvolutionBadge value={expEvo} />
            </div>
            <div className="mt-4 h-[40px] w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.evolution.slice(-6)}>
                  <defs>
                    <linearGradient id="sparkExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={REX_DARK} stopOpacity={0.1}/>
                      <stop offset="100%" stopColor={REX_DARK} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="depenses" stroke={REX_DARK} strokeWidth={2} fill="url(#sparkExp)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        
        {/* Recettes */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Recettes
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions(stats.recetteMonth || 0)}
                </div>
              </div>
              <EvolutionBadge value={recEvo} />
            </div>
            <div className="mt-4 h-[40px] w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.evolution.slice(-6)}>
                  <defs>
                    <linearGradient id="sparkRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="recettes" stroke="#3b82f6" strokeWidth={2} fill="url(#sparkRec)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Objectifs */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -z-10" />
          <CardContent className="p-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" /> Objectif Bancaire Global
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {chartData.globalBankStats ? chartData.globalBankStats.pourcentage.toFixed(1) : 0}%
                </div>
              </div>
              <EvolutionBadge value={chartData.globalBankStats ? chartData.globalBankStats.evolution : 0} />
            </div>
            <div className="mt-6 w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(chartData.globalBankStats ? chartData.globalBankStats.pourcentage : 0, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              {formatToMillions(chartData.globalBankStats ? chartData.globalBankStats.atteint : 0)} / {formatToMillions(chartData.globalBankStats ? chartData.globalBankStats.objectif : 0)}
            </p>
          </CardContent>
        </Card>

        {/* KPI Net Global En Caisse */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10" />
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-500" /> Net Global En Caisse
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions((syntheseData?.global?.recettes || 0) - (syntheseData?.global?.depenses || 0))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs font-medium">
              <span className="text-emerald-600">Revenus: {formatToMillions(syntheseData?.global?.recettes || 0)}</span>
              <span className="text-zinc-500">Dépenses: {formatToMillions(syntheseData?.global?.depenses || 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI Ligne 1 */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" /> Net Ligne 1
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions((syntheseData?.ligne1?.recettes || 0) - (syntheseData?.ligne1?.depenses || 0))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-medium truncate">Mbalmayo + Mvan</p>
          </CardContent>
        </Card>

        {/* KPI Ligne 2 */}
        <Card className="overflow-hidden bg-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-5 sm:p-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" /> Net Ligne 2
                </p>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                  {formatToMillions((syntheseData?.ligne2?.recettes || 0) - (syntheseData?.ligne2?.depenses || 0))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 font-medium truncate">Mimboman + Ayos + Akonolinga</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts - 3 Monolithic Full Width Charts */}
      <div className="flex flex-col gap-8">
        
        {/* Graphique Versements Bancaires */}
        <Card className="bg-background border-border/40 rounded-3xl shadow-sm overflow-hidden w-full">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">Versements Bancaires</CardTitle>
            </div>
            <CardDescription className="text-sm">
              {bankId === "ALL" ? "Tous les versements" : `Versements enregistrés chez ${banks?.find(b => b.id === bankId)?.nom}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaRevOnly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={REX_GREEN} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor={REX_GREEN} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} interval="preserveStartEnd" minTickGap={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={75} allowDecimals={false} />
                <RechartsTooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="revenues" name="Versements" stroke={REX_GREEN} strokeWidth={3} fillOpacity={1} fill="url(#areaRevOnly)" activeDot={{ r: 6, fill: REX_GREEN, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique Dépenses */}
        <Card className="bg-background border-border/40 rounded-3xl shadow-sm overflow-hidden w-full">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-zinc-500" />
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">Dépenses</CardTitle>
            </div>
            <CardDescription className="text-sm">Toutes les dépenses validées de la période</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaExpOnly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={REX_DARK} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={REX_DARK} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} interval="preserveStartEnd" minTickGap={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={75} allowDecimals={false} domain={[0, (dataMax: number) => dataMax === 0 ? 100 : Math.ceil(dataMax * 1.1)]} />
                <RechartsTooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="depenses" name="Dépenses" stroke={REX_DARK} strokeWidth={3} fillOpacity={1} fill="url(#areaExpOnly)" activeDot={{ r: 6, fill: REX_DARK, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique Recettes Journalières */}
        <Card className="bg-background border-border/40 rounded-3xl shadow-sm overflow-hidden w-full">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">Recettes Journalières</CardTitle>
            </div>
            <CardDescription className="text-sm">Recettes globales (Total Ligne 1 + Total Ligne 2)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaRecOnly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} interval="preserveStartEnd" minTickGap={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={75} allowDecimals={false} />
                <RechartsTooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="recettes" name="Recettes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#areaRecOnly)" activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Tableau des Objectifs Bancaires */}
      {chartData.banksStats && chartData.banksStats.length > 0 && (
        <Card className="bg-background border-border/40 rounded-3xl shadow-sm overflow-hidden mt-8">
          <CardHeader className="p-6 pb-4 border-b border-border/50">
            <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-500" /> Objectifs par Banque
            </CardTitle>
            <CardDescription className="text-sm">Suivi détaillé des performances bancaires</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Banque</th>
                    <th className="px-6 py-4 text-right">Objectif</th>
                    <th className="px-6 py-4 text-right">Atteint</th>
                    <th className="px-6 py-4 text-right">Restant</th>
                    <th className="px-6 py-4 text-center">Progression</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {chartData.banksStats.map((bank, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{bank.nom}</td>
                      <td className="px-6 py-4 text-right font-medium">{bank.objectif > 0 ? formatToMillions(bank.objectif) : '-'}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">{bank.atteint > 0 ? formatToMillions(bank.atteint) : '-'}</td>
                      <td className="px-6 py-4 text-right text-amber-600 font-medium">{bank.restant > 0 ? formatToMillions(bank.restant) : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold">{bank.pourcentage.toFixed(1)}%</span>
                          <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${bank.pourcentage >= 100 ? 'bg-emerald-500' : bank.pourcentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(bank.pourcentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          bank.statut === 'Atteint' ? 'bg-emerald-100 text-emerald-700' : 
                          bank.statut === 'Bientôt Atteint' ? 'bg-amber-100 text-amber-700' : 
                          bank.statut === 'Non défini' ? 'bg-zinc-100 text-zinc-500' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {bank.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
