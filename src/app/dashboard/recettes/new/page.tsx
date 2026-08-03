import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecetteForm } from "@/features/recettes/RecetteForm";
import { getAgencies } from "@/actions/agencyActions";
export const metadata = {
  title: "Nouvelle Recette journalière | REGIONALE EXPRESS VOYAGES SARL",
  description: "Créer un Nouvelle Recette journalière pour l'agence",
};

export default async function NewDepositPage() {
  const result = await getAgencies();
  const agencys = result?.data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recettes">
          <Button variant="ghost" size="icon" aria-label="Retour aux recettes" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle Recette journalière</h1>
          <p className="text-sm text-muted-foreground mt-1">Déclarez un dépôt bancaire des recettes.</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Détails du recette journalière</CardTitle>
          <CardDescription>Tous les champs avec une astérisque (*) sont obligatoires.</CardDescription>
        </CardHeader>
        <CardContent>
          <RecetteForm agencys={agencys} />
        </CardContent>
      </Card>
    </div>
  );
}
