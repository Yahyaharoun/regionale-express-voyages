import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DepositForm } from "@/features/deposits/DepositForm";
import { getBanks } from "@/actions/bankActions";
import { getAgencies } from "@/actions/agencyActions";

export const metadata = {
  title: "Nouveau Versement bancaire | REGIONALE EXPRESS VOYAGES SARL",
  description: "Créer un nouveau versement bancaire pour l'agence",
};

export default async function NewDepositPage() {
  const result = await getBanks();
  const banks = result?.data || [];

  const aResult = await getAgencies();
  const agencies = aResult?.data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/deposits">
          <Button variant="ghost" size="icon" aria-label="Retour aux versements" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveau Versement bancaire</h1>
          <p className="text-sm text-muted-foreground mt-1">Déclarez un dépôt bancaire des recettes.</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Détails du versement bancaire</CardTitle>
          <CardDescription>Tous les champs avec une astérisque (*) sont obligatoires.</CardDescription>
        </CardHeader>
        <CardContent>
          <DepositForm banks={banks} agencies={agencies} />
        </CardContent>
      </Card>
    </div>
  );
}
