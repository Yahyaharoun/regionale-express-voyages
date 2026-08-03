import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const caller = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!caller || caller.role !== 'PDG') redirect('/dashboard');

  const users = await prisma.user.findMany({
    where: { role: { not: 'PDG' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      role: true,
      isActive: true,
      lockedUntil: true,
      agencyId: true,
      agency: { select: { nom: true } },
    }
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gestion des Utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Créez et gérez les comptes du personnel. Accès réservé au PDG.
        </p>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
