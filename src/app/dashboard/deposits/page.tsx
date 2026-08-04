import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Clock, CheckCircle2, Plus } from "lucide-react";
import { getOperations } from "@/actions/operationActions";
import Link from "next/link";
import { DateFilterDropdown } from "@/features/expenses/DateFilterDropdown";
import { Button } from "@/components/ui/button";
import { OperationActionsMenu } from "@/components/OperationActionsMenu";
import { OperationDetailsModal } from "@/components/OperationDetailsModal";
import { OperationListClient } from "@/features/operations/OperationListClient";
import { getCurrentUser } from "@/lib/auth";

export default async function DepositsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const range = (searchParams?.range as string) || "jour";
  const result = await getOperations(0, 50, range);
  const user = await getCurrentUser();
  const role = user?.role || "CAISSIER";
  const canValidate = role === "DG" || role === "PDG" || role === "DGA";
  const operations = result?.data ?? [];
  const deposits = operations.filter((op) => op.type === "VERSEMENT");

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Versements bancaires</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            historique des versements bancaires bancaires de votre agence.
          </p>
        </div>
        <Link href="/dashboard/deposits/new" className="w-full sm:w-auto">
          <Button size="sm" className="shadow-[0_2px_10px_rgba(0,0,0,0.08)] w-full transition-all duration-200 active:scale-95">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Nouveau Versement bancaire
          </Button>
        </Link>
      </div>

      <div className="flex justify-end">
        <DateFilterDropdown />
      </div>

      <OperationListClient 
        operations={deposits} 
        role={role} 
        editUrlPrefix="/dashboard/deposits" 
      />
    </div>
  );
}
