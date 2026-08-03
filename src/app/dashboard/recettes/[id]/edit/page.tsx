import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditRecetteForm } from "@/features/recettes/EditRecetteForm";
import { getAgencies } from "@/actions/agencyActions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Modifier la recette journalière bancaire | REGIONALE EXPRESS VOYAGES SARL",
  description: "Modifier une recette journalière",
};

export default async function EditDepositPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const result = await getAgencies();
  const agencys = result?.data || [];

  const operation = await prisma.operation.findUnique({
    where: { id: params.id },
  });

  if (!operation || operation.type !== "RECETTE") {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recettes">
          <Button variant="ghost" size="icon" aria-label="Retour aux recettes" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier la recette journalière</h1>
          <p className="text-sm text-muted-foreground mt-1">Mettez à jour les informations du dépôt bancaire</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Détails de la recette journalière</CardTitle>
          <CardDescription>Modifiez les champs ci-dessous.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditRecetteForm agencys={agencys} operation={operation} />
        </CardContent>
      </Card>
    </div>
  );
}
