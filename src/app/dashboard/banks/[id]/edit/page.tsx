import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditBankForm } from "./EditBankForm";

export default async function EditBankPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // also fetch objective to prefill
  const bank = await prisma.bank.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!bank) {
    notFound();
  }

  const date = new Date();
  const premierJour = new Date(date.getFullYear(), date.getMonth(), 1);
  const existingObj = await prisma.bankObjective.findFirst({
    where: { bankId: bank.id, dateDebut: { gte: premierJour } }
  });

  const objective = existingObj ? existingObj.montant : 0;

  return <EditBankForm bank={bank} objective={objective} />;
}
