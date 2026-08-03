import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditDepositForm } from "@/features/deposits/EditDepositForm";
import { getBanks } from "@/actions/bankActions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Modifier le Versement bancaire bancaire | REGIONALE EXPRESS VOYAGES SARL",
  description: "Modifier un versement bancaire",
};

export default async function EditDepositPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const result = await getBanks();
  const banks = result?.data || [];

  const operation = await prisma.operation.findUnique({
    where: { id: params.id },
  });

  if (!operation || operation.type !== "VERSEMENT") {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/deposits">
          <Button variant="ghost" size="icon" aria-label="Retour aux versements" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier le Versement bancaire</h1>
          <p className="text-sm text-muted-foreground mt-1">Mettez à jour les informations du dépôt bancaire</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Détails du versement bancaire</CardTitle>
          <CardDescription>Modifiez les champs ci-dessous.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditDepositForm banks={banks} operation={operation} />
        </CardContent>
      </Card>
    </div>
  );
}
