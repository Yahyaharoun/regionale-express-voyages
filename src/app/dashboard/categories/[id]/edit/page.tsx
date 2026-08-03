import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditCategoryForm } from "./EditCategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const category = await prisma.category.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!category) {
    notFound();
  }

  return <EditCategoryForm category={category} />;
}
