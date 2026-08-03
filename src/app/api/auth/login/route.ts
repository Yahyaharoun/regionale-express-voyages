import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPin, encryptSession } from '@/lib/auth';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { nom, poste, pin } = await req.json();

    if (!nom || !poste || !pin) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const nomUpper = nom.toUpperCase().trim();
    
    // On cherche l'ID en SQL brut pour gérer la concaténation nom+prenom efficacement
    const matchingUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User"
      WHERE UPPER(email) = ${nomUpper}
         OR TRIM(UPPER(nom || ' ' || COALESCE(prenom, ''))) = ${nomUpper}
         OR TRIM(UPPER(COALESCE(prenom, '') || ' ' || nom)) = ${nomUpper}
         OR UPPER(nom) = ${nomUpper}
         OR UPPER(prenom) = ${nomUpper}
      LIMIT 1
    `;

    let dbUser = null;
    if (matchingUsers.length > 0) {
      dbUser = await prisma.user.findUnique({
        where: { id: matchingUsers[0].id },
        include: {
          appRole: {
            include: { permissions: { include: { permission: true } } }
          }
        }
      });
    }

    // Protection contre les Timing Attacks : on simule toujours le temps de vérification de bcrypt
    // même si l'utilisateur n'existe pas. (Hash valide pour 'dummy')
    const fakeHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxep68pNDgJ2RcM5u";

    if (!dbUser) {
      await verifyPin(pin, fakeHash); // Timing attack mitigation
      // Log failed attempt
      await prisma.loginLog.create({
        data: { email: nom, ipAddress, userAgent, success: false, reason: 'Utilisateur introuvable' }
      });
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 });
    }

    // 2. Vérification du verrouillage
    if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Compte temporairement verrouillé. Veuillez réessayer plus tard.' }, { status: 403 });
    }

    // 3. Vérification du poste
    if (dbUser.role !== poste) {
      await logFailedAttempt(dbUser.id, nom, ipAddress, userAgent, 'Poste incorrect');
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 });
    }

    // 4. Vérification si actif
    if (!dbUser.isActive) {
      await logFailedAttempt(dbUser.id, nom, ipAddress, userAgent, 'Compte inactif');
      return NextResponse.json({ error: 'Ce compte est désactivé.' }, { status: 403 });
    }

    // 5. Vérification du PIN
    if (!dbUser.pinHash) {
      return NextResponse.json({ error: 'Aucun code PIN configuré.' }, { status: 401 });
    }

    const isPinValid = await verifyPin(pin, dbUser.pinHash);
    
    if (!isPinValid) {
      const newAttempts = dbUser.failedAttempts + 1;
      let lockedUntil = null;
      
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
      }
      
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { failedAttempts: newAttempts, lockedUntil }
      });

      await logFailedAttempt(dbUser.id, nom, ipAddress, userAgent, 'PIN invalide');
      
      if (lockedUntil) {
        return NextResponse.json({ error: 'Trop de tentatives échouées. Compte verrouillé pour 15 minutes.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 });
    }

    // Succès de l'authentification
    // Réinitialiser les tentatives
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { failedAttempts: 0, lockedUntil: null, derniereConnexion: new Date() }
    });

    // 6. Extraction des permissions
    const permissions = dbUser.appRole?.permissions.map(p => p.permission.name) || [];

    // 7. Création de la session
    const sessionPayload = {
      userId: dbUser.id,
      role: dbUser.role,
      roleId: dbUser.roleId,
      permissions,
      fullName: `${dbUser.nom} ${dbUser.prenom}`,
    };

    const token = await encryptSession(sessionPayload);

    // Stockage dans un cookie HTTP Only
    (await cookies()).set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 heures
    });

    // 8. Log de succès & Audit
    await prisma.loginLog.create({
      data: { userId: dbUser.id, email: nom, ipAddress, userAgent, success: true }
    });
    
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        role: dbUser.role,
        action: 'CONNEXION',
        tableName: 'User',
        recordId: dbUser.id,
      }
    });

    return NextResponse.json({ success: true, redirect: getRedirectRoute(dbUser.role) });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

async function logFailedAttempt(userId: string, email: string, ipAddress: string, userAgent: string, reason: string) {
  await prisma.loginLog.create({
    data: { userId, email, ipAddress, userAgent, success: false, reason }
  });
}

function getRedirectRoute(role: string) {
  switch (role) {
    case 'PDG':
    case 'DGA':
      return '/dashboard';
    case 'CHEF_AGENCE':
      return '/dashboard/agencies';
    case 'COMPTABLE':
      return '/dashboard/expenses';
    default:
      return '/dashboard';
  }
}
