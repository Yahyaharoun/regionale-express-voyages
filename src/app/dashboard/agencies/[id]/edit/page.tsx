import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditAgencyForm } from "./EditAgencyForm";
import { getPotentialManagers } from "@/actions/agencyActions";

export default async function EditAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const agency = await prisma.agency.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!agency) {
    notFound();
  }

  const managersResult = await getPotentialManagers();
  const managers = managersResult.success && managersResult.data ? managersResult.data : [];

  return <EditAgencyForm agency={agency} managers={managers} />;
}
