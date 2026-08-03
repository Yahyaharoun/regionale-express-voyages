import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, LogIn, Activity } from "lucide-react";

function parseUA(ua: string | null) {
  if (!ua) return { browser: '-', device: '-' };
  let browser = '-';
  if (ua.includes('Edge') || ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  
  let device = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad')) {
    device = 'Mobile';
  }
  return { browser, device };
}

export default async function LogsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser || (dbUser.role !== 'PDG' && dbUser.role !== 'DGA')) {
    redirect("/dashboard");
  }

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { nom: true, prenom: true } } }
  });

  const loginLogs = await prisma.loginLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { nom: true, prenom: true } } }
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Journal d'Audit</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Trace de toutes les activités de la plateforme.</p>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actions Système
          </TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Connexions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card className="border-border/40 shadow-none">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun log d'action trouvé.</TableCell>
                  </TableRow>
                ) : auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
                    <TableCell className="font-medium text-sm">{log.user?.prenom} {log.user?.nom}</TableCell>
                    <TableCell><span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/10 text-primary tracking-widest">{log.role}</span></TableCell>
                    <TableCell className="font-medium text-xs">{log.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.tableName} ({log.recordId.split('-')[0]})</TableCell>
                    <TableCell>
                      {/* Placeholder pour un modal de détails */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="login">
          <Card className="border-border/40 shadow-none">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Email/Utilisateur</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Navigateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Raison</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun log de connexion trouvé.</TableCell>
                  </TableRow>
                ) : loginLogs.map((log) => {
                  const { browser, device } = parseUA(log.userAgent);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="font-medium text-sm">{log.email} {log.user ? `(${log.user.prenom} ${log.user.nom})` : ''}</TableCell>
                      <TableCell className="text-xs font-mono">{log.ipAddress || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{device}</TableCell>
                      <TableCell className="text-xs">{browser}</TableCell>
                      <TableCell>
                        {log.success ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 tracking-widest">Succès</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-destructive/10 text-destructive tracking-widest">Échec</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.reason || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
