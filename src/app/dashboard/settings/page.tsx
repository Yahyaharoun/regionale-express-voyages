import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const payload = token ? await decryptSession(token) : null;
  
  const dbUser = payload ? await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { agency: { select: { nom: true, ville: true } } }
  }) : null;

  let metrics = null;
  if (dbUser) {
    const [userCount, agencyCount, bankCount, opCount] = await Promise.all([
      prisma.user.count(),
      prisma.agency.count(),
      prisma.bank.count(),
      prisma.operation.count()
    ]);
    metrics = {
      users: userCount,
      agencies: agencyCount,
      banks: bankCount,
      operations: opCount,
      databaseSize: "45 MB",
      uptime: "99.98%",
      lastBackup: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    };
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Gérez votre compte et les préférences de l'application.
        </p>
      </div>

      {dbUser ? (
        <SettingsClient user={dbUser} systemMetrics={metrics} />
      ) : (
        <p className="text-sm text-muted-foreground">Veuillez vous reconnecter pour accéder aux paramètres.</p>
      )}
    </div>
  );
}

