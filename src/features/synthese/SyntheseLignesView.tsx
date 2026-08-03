"use client";

import { useState, useEffect } from "react";
import { getSyntheseLignesData } from "@/actions/syntheseActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Activity, Building, PieChart as PieChartIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

const REX_GREEN = "#10b981"; // emerald-500
const REX_DARK = "#18181b"; // zinc-900
const L1_COLOR = "#3b82f6"; // blue-500
const L2_COLOR = "#a855f7"; // purple-500
const RED_COLOR = "#ef4444"; // red-500

const COLORS = [L1_COLOR, L2_COLOR, REX_GREEN, '#f59e0b', '#ec4899', '#6366f1'];

export function SyntheseLignesView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("MOIS");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getSyntheseLignesData(period);
      if (res?.success) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, [period]);

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" /></div>;
  }

  if (!data) return <div className="text-center p-8 text-destructive">Erreur de chargement des données.</div>;

  const netLigne1 = data.ligne1.recettes - data.ligne1.depenses;
  const netLigne2 = data.ligne2.recettes - data.ligne2.depenses;
  const netGlobal = data.global.recettes - data.global.depenses;
  
  const evolution = data.evolution || [];
  const agencyDistribution = data.agencyDistribution || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-zinc-100 dark:to-zinc-400">Synthèse Financière</h2>
          <p className="text-muted-foreground mt-1">Analyse des performances par ligne et globale.</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={period} onValueChange={(val) => setPeriod(val as any)}>
            <SelectTrigger className="h-11 bg-background">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOUR">Jour</SelectItem>
              <SelectItem value="HIER">Hier</SelectItem>
              <SelectItem value="SEMAINE">Semaine</SelectItem>
              <SelectItem value="MOIS">Mois</SelectItem>
              <SelectItem value="ANNEE">Année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CARTES LIGNE 1 & LIGNE 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LIGNE 1 */}
        <Card className="border-border/60 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 rounded-3xl bg-background">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
          
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-500" /> LIGNE 1
                </CardTitle>
                <CardDescription className="mt-1 text-sm font-medium">Mbalmayo, Yaoundé Mvan</CardDescription>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-inner">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.ligne1.agencies.map((ag: any) => (
                <div key={ag.id} className="flex justify-between items-center pb-2 border-b border-border/30 border-dashed group/item">
                  <span className="text-muted-foreground font-medium flex items-center gap-2 group-hover/item:text-foreground transition-colors">
                    <Building className="w-4 h-4 text-blue-400" /> {ag.nom}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{ag.recettes.toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
              {data.ligne1.agencies.length === 0 && (
                 <div className="text-center text-muted-foreground text-sm italic py-4">Aucune donnée pour cette ligne.</div>
              )}
            </div>
            
            <div className="pt-6 mt-4 border-t-2 border-border/60 space-y-4">
              <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Total Recettes L1</span>
                <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">{data.ligne1.recettes.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="font-medium text-muted-foreground">Dépenses L1</span>
                <span className="font-bold text-destructive tabular-nums">- {data.ligne1.depenses.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="mt-6">
              <div className={`p-4 rounded-xl flex justify-between items-center border shadow-sm ${netLigne1 >= 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
                <span className="font-bold text-lg tracking-wide uppercase">Net en Caisse L1</span>
                <span className={`font-black text-2xl tabular-nums ${netLigne1 >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {netLigne1.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LIGNE 2 */}
        <Card className="border-border/60 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 rounded-3xl bg-background">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />
          
          <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-500" /> LIGNE 2
                </CardTitle>
                <CardDescription className="mt-1 text-sm font-medium">Mimboman, Ayos, Akonolinga</CardDescription>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow-inner">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.ligne2.agencies.map((ag: any) => (
                <div key={ag.id} className="flex justify-between items-center pb-2 border-b border-border/30 border-dashed group/item">
                  <span className="text-muted-foreground font-medium flex items-center gap-2 group-hover/item:text-foreground transition-colors">
                    <Building className="w-4 h-4 text-purple-400" /> {ag.nom}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{ag.recettes.toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
              {data.ligne2.agencies.length === 0 && (
                 <div className="text-center text-muted-foreground text-sm italic py-4">Aucune donnée pour cette ligne.</div>
              )}
            </div>
            
            <div className="pt-6 mt-4 border-t-2 border-border/60 space-y-4">
              <div className="flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Total Recettes L2</span>
                <span className="font-black text-purple-600 dark:text-purple-400 tabular-nums">{data.ligne2.recettes.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="font-medium text-muted-foreground">Dépenses L2</span>
                <span className="font-bold text-destructive tabular-nums">- {data.ligne2.depenses.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="mt-6">
              <div className={`p-4 rounded-xl flex justify-between items-center border shadow-sm ${netLigne2 >= 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
                <span className="font-bold text-lg tracking-wide uppercase">Net en Caisse L2</span>
                <span className={`font-black text-2xl tabular-nums ${netLigne2 >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {netLigne2.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SYNTHÈSE GLOBALE */}
      <Card className="border-border/60 shadow-xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <CardHeader className="relative z-10 pb-0">
          <CardTitle className="text-2xl text-center font-light tracking-widest text-zinc-300">SYNTHÈSE GLOBALE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6 sm:p-10 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex justify-between items-center">
              <span className="text-zinc-400 font-medium text-lg">RECETTE BRUTE</span>
              <span className="font-bold text-2xl tracking-tight">{data.global.recettes.toLocaleString('fr-FR')} <span className="text-sm font-normal text-zinc-500">FCFA</span></span>
            </div>
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-5 flex justify-between items-center">
              <span className="text-red-300 font-medium text-lg">TOUTES DÉPENSES</span>
              <span className="font-bold text-2xl text-red-400 tracking-tight">- {data.global.depenses.toLocaleString('fr-FR')} <span className="text-sm font-normal opacity-70">FCFA</span></span>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto mt-6">
            <div className={`p-8 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl ${netGlobal >= 0 ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-900/40 border-emerald-500/30' : 'bg-gradient-to-r from-red-600/20 to-red-900/40 border-red-500/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${netGlobal >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-zinc-300 text-sm font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                    Net Global en Caisse
                    {data.global.prevNetGlobal !== undefined && data.global.prevNetGlobal !== 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${((netGlobal - data.global.prevNetGlobal) / Math.abs(data.global.prevNetGlobal)) * 100 > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {(((netGlobal - data.global.prevNetGlobal) / Math.abs(data.global.prevNetGlobal)) * 100) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(((netGlobal - data.global.prevNetGlobal) / Math.abs(data.global.prevNetGlobal)) * 100).toFixed(1)}%
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500">Recettes Brutes - Toutes Dépenses (Toutes lignes)</p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`font-black text-4xl sm:text-5xl tracking-tighter ${netGlobal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netGlobal.toLocaleString('fr-FR')}
                </span>
                <span className="text-xl ml-2 font-light text-zinc-400">FCFA</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Évolution Comparée L1 vs L2 */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Évolution des Recettes L1 vs L2</CardTitle>
            <CardDescription>Comparatif des recettes brutes sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorL1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={L1_COLOR} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={L1_COLOR} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorL2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={L2_COLOR} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={L2_COLOR} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="recettesL1" name="Recettes Ligne 1" stroke={L1_COLOR} strokeWidth={3} fillOpacity={1} fill="url(#colorL1)" />
                  <Area type="monotone" dataKey="recettesL2" name="Recettes Ligne 2" stroke={L2_COLOR} strokeWidth={3} fillOpacity={1} fill="url(#colorL2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Évolution Net Global vs Dépenses */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Rentabilité & Dépenses</CardTitle>
            <CardDescription>Suivi du Net Global face aux charges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(val) => `${val / 1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="depenses" name="Total Dépenses" fill={RED_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="netGlobal" name="Net Global" stroke={REX_GREEN} strokeWidth={4} dot={{ r: 4, fill: REX_GREEN, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par Agence (Pie) */}
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" /> Répartition du Chiffre d'Affaires par Agence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agencyDistribution.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agencyDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) => { return `${name} : ${Number(value).toLocaleString('fr-FR')} FCFA (${(percent! * 100).toFixed(1)}%)`;}}
                      labelLine={false}
                    >
                      {agencyDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, "Montant"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground italic">
                Aucune donnée de recette pour cette période.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
