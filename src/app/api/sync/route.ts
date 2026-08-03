import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SyncQueueItem } from '@/lib/dexie';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const item: SyncQueueItem = await req.json();

    if (item.entity === 'Operation') {
      if (item.action === 'CREATE') {
        // Enregistrer l'opération
        // payload contient les mêmes champs que le formData initial
        const { type, montant, agencyId, categoryId, commentaire, reference, bankId } = item.payload;

        await prisma.operation.create({
          data: {
            id: item.payload.id || undefined, // On peut forcer l'ID pour éviter les doublons
            type,
            statut: 'EN_ATTENTE',
            montant: parseInt(montant),
            agencyId,
            categoryId,
            commentaire,
            reference,
            bankId,
            agentId: user.userId,
          }
        });
        
        return NextResponse.json({ success: true, id: item.payload.id });
      }
      
      // TODO: Implémenter UPDATE et DELETE si nécessaire
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
