"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Activity, Wallet, TrendingUp, Building, ArrowRightLeft, Target } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";
import { PDGStats } from "@/actions/dashboardActions";

interface TVDashboardClientProps {
  stats: PDGStats;
  chartData: {
    expensesByCategory: { name: string, value: number }[];
    expensesByAgency: { name: string, value: number }[];
    depositsByBank: { name: string, value: number }[];
    evolution: { month: string, revenues: number, depenses: number }[];
  }
}

const COLORS = ['#0B8F3A', '#2FBF5B', '#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'];

export function TVDashboardClient({ stats, chartData }: TVDashboardClientProps) {
  
  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* KPIs Level 1 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card shadow-lg border border-border/50 rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Solde Théorique</CardTitle>
            <Wallet className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tight text-primary">
              {stats.theoreticalBalance.toLocaleString('fr-FR')} <span className="text-xl font-bold text-muted-foreground">FCFA</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Total Versements bancaires - Total Dépenses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg border border-border/50 rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Versements bancaires (Mois)</CardTitle>
            <ArrowRightLeft className="h-6 w-6 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tight text-emerald-500">
              {stats.revenueMonth.toLocaleString('fr-FR')} <span className="text-xl font-bold text-muted-foreground">FCFA</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Aujourd'hui: <span className="text-foreground font-bold">{stats.revenueDay.toLocaleString('fr-FR')} FCFA</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg border border-border/50 rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dépenses (Mois)</CardTitle>
            <Activity className="h-6 w-6 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tight text-destructive">
              {stats.expenseMonth.toLocaleString('fr-FR')} <span className="text-xl font-bold text-muted-foreground">FCFA</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Aujourd'hui: <span className="text-foreground font-bold">{stats.expenseDay.toLocaleString('fr-FR')} FCFA</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg border border-border/50 rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Objectif Bancaire</CardTitle>
            <Target className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-black tracking-tight text-foreground">
                {stats.objectiveProgress.toFixed(1)}%
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${stats.objectiveProgress >= 80 ? 'bg-emerald-500' : stats.objectiveProgress >= 50 ? 'bg-amber-500' : 'bg-destructive'}`}
                  style={{ width: `${Math.min(stats.objectiveProgress, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Sur {stats.bankObjective.toLocaleString('fr-FR')} FCFA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Level 2 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 flex-1">
        {/* Graphique Évolution */}
        <Card className="bg-card shadow-lg border border-border/50 rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Évolution Financière</CardTitle>
            <CardDescription className="text-base">Revenus et Dépenses mensuels</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.evolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Area type="monotone" dataKey="revenues" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenues)" name="Versements bancaires" />
                <Area type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" name="Dépenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Camembert des dépenses */}
        <Card className="bg-card shadow-lg border border-border/50 rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Répartition des Dépenses</CardTitle>
            <CardDescription className="text-base">Par catégorie d'exploitation</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 w-full flex items-center justify-center min-h-[300px]">
            {chartData.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: '500' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-lg font-medium text-muted-foreground text-center flex flex-col items-center gap-2">
                <Activity className="w-12 h-12 opacity-20" />
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
