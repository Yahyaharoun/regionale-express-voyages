import Dexie, { Table } from 'dexie';

export interface LocalOperation {
  id: string; // uuid
  type: 'DEPENSE' | 'RECETTE' | 'VERSEMENT' | 'PAIEMENT_FOURNISSEUR';
  statut: 'BROUILLON' | 'EN_ATTENTE' | 'VALIDEE_DG' | 'VALIDEE' | 'REJETEE' | 'ANNULEE';
  montant: number;
  categoryId?: string | null;
  commentaire?: string | null;
  agencyId: string;
  agentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED'; // Pour la synchronisation
}

export interface SyncQueueItem {
  id: string; // uuid
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'Operation'; // pour commencer
  payload: any;
  createdAt: Date;
  retryCount: number;
}

export class ERPDatabase extends Dexie {
  operations!: Table<LocalOperation, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('RegionaleExpressDB');
    this.version(1).stores({
      operations: 'id, type, statut, agencyId, syncStatus, createdAt',
      syncQueue: 'id, action, entity, createdAt'
    });
  }
}

export const db = new ERPDatabase();
