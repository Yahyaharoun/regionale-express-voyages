import { db, SyncQueueItem, LocalOperation } from './dexie';

export class SyncManager {
  static async enqueue(action: 'CREATE' | 'UPDATE' | 'DELETE', entity: 'Operation', payload: any) {
    const id = payload.id || crypto.randomUUID();
    const item: SyncQueueItem = {
      id,
      action,
      entity,
      payload,
      createdAt: new Date(),
      retryCount: 0
    };
    await db.syncQueue.add(item);
    
    // Trigger sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      this.syncAll();
    }
  }

  static async syncAll() {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    const pendingItems = await db.syncQueue.orderBy('createdAt').toArray();
    
    for (const item of pendingItems) {
      try {
        await this.processItem(item);
        // Si réussi, on supprime de la queue et on marque l'entité locale comme SYNCED
        await db.syncQueue.delete(item.id);
        
        if (item.entity === 'Operation' && item.payload.id) {
          await db.operations.update(item.payload.id, { syncStatus: 'SYNCED' });
        }
      } catch (error) {
        console.error('Erreur de synchronisation pour l\'item', item.id, error);
        await db.syncQueue.update(item.id, { retryCount: item.retryCount + 1 });
      }
    }
  }

  private static async processItem(item: SyncQueueItem) {
    // Ici, nous appelons les API routes existantes ou les Server Actions
    // Comme nous utilisons les Server Actions de Next.js, nous devons simuler l'appel API
    // ou créer une route d'API dédiée pour la synchronisation.
    
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      throw new Error(`Sync failed with status: ${res.status}`);
    }
    
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  }
}

// Écouter le retour du réseau pour déclencher la synchronisation
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    SyncManager.syncAll();
  });
}
