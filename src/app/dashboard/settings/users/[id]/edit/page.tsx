import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserEditForm } from "./UserEditForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }

  const agencies = await prisma.agency.findMany({
    where: { isActive: true },
    orderBy: { nom: 'asc' }
  });

  const { getCurrentUser } = await import('@/lib/auth');
  const session = await getCurrentUser();
  let currentUserRole = "AGENT";
  let currentUserId = "";
  if (session) {
    const caller = await prisma.user.findUnique({ where: { id: session.userId } });
    if (caller) {
      currentUserRole = caller.role;
      currentUserId = caller.id;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier l'Utilisateur</h1>
          <p className="text-sm text-muted-foreground mt-1">Mettez à jour les informations et accès.</p>
        </div>
      </div>
      
      <UserEditForm user={user} agencies={agencies} currentUserRole={currentUserRole} currentUserId={currentUserId} />
    </div>
  );
}
