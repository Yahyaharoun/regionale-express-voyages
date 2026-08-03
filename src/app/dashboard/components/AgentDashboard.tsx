"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownRight, Clock, CheckCircle2, XCircle, FileEdit } from "lucide-react";
import Link from "next/link";
import { DynamicGreeting } from "@/components/DynamicGreeting";

interface AgentDashboardProps {
  userName: string;
  agencyName: string;
  stats: {
    pendingCount: number;
    pendingAmount: number;
    draftCount: number;
    rejectedCount: number;
  };
  operations: any[];
}

export function AgentDashboard({ userName, agencyName, stats, operations }: AgentDashboardProps) {
  const { pendingCount, pendingAmount, draftCount, rejectedCount } = stats;

  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <DynamicGreeting name={userName} />
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">Voici le résumé de vos opérations à {agencyName}.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <Link href="/dashboard/deposits/new" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11 rounded-xl shadow-sm border-border/50 hover:bg-muted/30 transition-all text-sm font-semibold">
              <ArrowDownRight className="mr-2 h-4 w-4 text-emerald-500" />
              Nouveau Versement bancaire
            </Button>
          </Link>
          <Link href="/dashboard/expenses/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Dépense
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards - Premium Level */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        
        {/* En Attente */}
        <Card className="overflow-hidden bg-background border-border/40 hover:border-border transition-all duration-500 shadow-sm hover:shadow-md rounded-2xl relative group">
          <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> En attente
              </p>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                {pendingAmount.toLocaleString('fr-FR')} <span className="text-base font-semibold text-muted-foreground">FCFA</span>
              </div>
            </div>
            <p className="text-sm font-medium mt-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                {pendingCount}
              </span>
              <span className="text-muted-foreground">opération(s) soumise(s)</span>
            </p>
          </CardContent>
        </Card>

        {/* Rejetées */}
        <Card className="overflow-hidden bg-background border-border/40 hover:border-border transition-all duration-500 shadow-sm hover:shadow-md rounded-2xl relative group">
          <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <XCircle className="w-24 h-24" />
          </div>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" /> Rejetées
              </p>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
                {rejectedCount}
              </div>
            </div>
            <p className="text-sm text-rose-500 font-medium mt-4">
              Nécessite votre attention
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
