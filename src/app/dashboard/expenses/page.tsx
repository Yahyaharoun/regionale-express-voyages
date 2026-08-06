import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Filter, Plus, Clock, CheckCircle2, XCircle, FileEdit, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Operation, Category } from "@prisma/client";
import { getOperations } from "@/actions/operationActions";
import { ApprovalButtons } from "@/features/expenses/ApprovalButtons";
import { ExportMenu } from "@/features/expenses/ExportMenu";
import { DateFilterDropdown } from "@/features/expenses/DateFilterDropdown";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OperationActionsMenu } from "@/components/OperationActionsMenu";
import { OperationDetailsModal } from "@/components/OperationDetailsModal";
import { OperationListClient } from "@/features/operations/OperationListClient";

export default async function ExpensesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const range = (searchParams?.range as string) || "all";
  const user = await getCurrentUser();
  let role = "CAISSIER";
  
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { role: true } });
    if (dbUser) role = dbUser.role;
  }

  const result = await getOperations(0, 50, range);
  const operations = result?.data || [];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dépenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos dépenses.</p>
        </div>
        <Link href="/dashboard/expenses/new" className="w-full sm:w-auto">
          <Button size="sm" className="shadow-[0_2px_10px_rgba(0,0,0,0.08)] w-full transition-all duration-200 active:scale-95">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouvelle Dépense
          </Button>
        </Link>
      </div>

      {/* Filters Mobile-First */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une opération..." 
            className="pl-9 h-9 bg-background border-border/40 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-200 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <ExportMenu />
          <Button variant="outline" size="sm" className="h-9 px-3 bg-background flex-1 sm:flex-none border-border/40 shadow-none hover:bg-muted/30 hidden">
            <Filter className="h-3.5 w-3.5 mr-2" />
            Filtrer
          </Button>
          <DateFilterDropdown />
        </div>
      </div>

      {/* Expenses List */}
      <OperationListClient 
        operations={operations} 
        role={role} 
        editUrlPrefix="/dashboard/expenses" 
      />
    </div>
  );
}
