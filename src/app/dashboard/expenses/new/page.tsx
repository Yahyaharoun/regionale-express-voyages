import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/features/expenses/ExpenseForm";

import { getCategories } from "@/actions/categoryActions";
import { getFournisseurs } from "@/actions/fournisseurActions";
import { getAgencies } from "@/actions/agencyActions";

export const metadata = {
  title: "Nouvelle Dépense | REGIONALE EXPRESS VOYAGES SARL",
  description: "Créer une nouvelle dépense pour l'agence",
};

export default async function NewExpensePage({ searchParams }: { searchParams: { fournisseurId?: string } }) {
  const result = await getCategories();
  const categories = result?.data || [];
  
  const fResult = await getFournisseurs();
  const fournisseurs = fResult?.data || [];

  const aResult = await getAgencies();
  const agencies = aResult?.data || [];

  const defaultFournisseurId = searchParams?.fournisseurId;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/expenses">
          <Button variant="ghost" size="icon" aria-label="Retour aux dépenses" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle Dépense</h1>
          <p className="text-sm text-muted-foreground mt-1">Saisissez les détails de l'opération</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Détails de la dépense</CardTitle>
          <CardDescription>Tous les champs avec une astérisque (*) sont obligatoires.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm 
            categories={categories} 
            fournisseurs={fournisseurs} 
            agencies={agencies}
            defaultFournisseurId={defaultFournisseurId} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
