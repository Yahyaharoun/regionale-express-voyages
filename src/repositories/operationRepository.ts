import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { writeAuditLog } from "@/lib/auditService";

export class OperationRepository {
  /**
   * Fetches operations with pagination and agency scope
   */
  static findAll = async (agencyId: string, skip: number = 0, take: number = 50, range?: string) => {
    let dateFilter = {};
    if (range && range !== 'all') {
      const offset = 1; 
      const nowUtc = new Date();
      const localNow = new Date(nowUtc.getTime() + (offset * 3600000));
      
      const year = localNow.getUTCFullYear();
      const month = localNow.getUTCMonth();
      const date = localNow.getUTCDate();
      
      let start: Date | null = null;
      let end: Date | null = null;
      
      if (range === 'jour' || range === 'today') {
        start = new Date(Date.UTC(year, month, date, -offset, 0, 0, 0));
        end = new Date(Date.UTC(year, month, date, 23 - offset, 59, 59, 999));
      } else if (range === 'semaine') {
        const day = localNow.getUTCDay() || 7;
        start = new Date(Date.UTC(year, month, date - day + 1, -offset, 0, 0, 0));
        end = new Date(Date.UTC(year, month, date + (7 - day), 23 - offset, 59, 59, 999));
      } else if (range === 'mois') {
        start = new Date(Date.UTC(year, month, 1, -offset, 0, 0, 0));
        end = new Date(Date.UTC(year, month + 1, 0, 23 - offset, 59, 59, 999));
      } else if (range === 'annee') {
        start = new Date(Date.UTC(year, 0, 1, -offset, 0, 0, 0));
        end = new Date(Date.UTC(year, 11, 31, 23 - offset, 59, 59, 999));
      }
      
      if (start && end) {
        dateFilter = { dateOperation: { gte: start, lte: end } };
      }
    }

    const whereClause: any = { ...dateFilter };
    if (agencyId && agencyId !== 'ALL') {
      whereClause.agencyId = agencyId;
    }

    const results = await prisma.operation.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { dateOperation: 'desc' },
      include: {
        category: { select: { id: true, nom: true } },
        agency: { select: { id: true, nom: true } },
        agent: { select: { id: true, nom: true, prenom: true } },
        fournisseur: { select: { id: true, nom: true } },
        lignes: true,
        bank: true
      }
    });

    results.sort((a, b) => {
      const aPending = ['EN_ATTENTE', 'BROUILLON', 'A_VALIDER'].includes(a.statut);
      const bPending = ['EN_ATTENTE', 'BROUILLON', 'A_VALIDER'].includes(b.statut);
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      const timeA = new Date(a.dateOperation || a.createdAt).getTime();
      const timeB = new Date(b.dateOperation || b.createdAt).getTime();
      return timeB - timeA;
    });

    return results;
  };

  /**
   * Creates a new operation while enforcing RLS context for Triggers.
   * Also writes an audit log entry in the same transaction.
   */
  static async create(data: Prisma.OperationCreateInput, agentId: string, agentRole: string, agencyId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Set local RLS context securely using set_config
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${agentId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${agentRole}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_agency', ${agencyId}, true)`;

      // Auto-validation pour PDG et DG
      if (agentRole === 'PDG' || agentRole === 'DG') {
        data.statut = 'VALIDEE';
        data.validateur = { connect: { id: agentId } };
      }

      // 2. Perform the actual creation
      const operation = await tx.operation.create({
        data,
      });

      // 3. Write audit log in the same transaction (atomic)
      await writeAuditLog(tx, {
        userId: agentId,
        role: agentRole,
        action: 'CREATE_OPERATION',
        tableName: 'Operation',
        recordId: operation.id,
        oldData: null,
        newData: {
          type: operation.type,
          statut: operation.statut,
          montant: operation.montant,
          agencyId: operation.agencyId,
          commentaire: operation.commentaire,
        },
      });

      return operation;
    });
  }

  /**
   * Updates the status of an operation (Workflow de validation).
   * Also writes an audit log entry in the same transaction.
   */
  static async updateStatus(id: string, statut: "VALIDEE" | "REJETEE" | "VALIDEE_DG", validateurId: string, validateurRole: string = 'DGA') {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch the current state for audit diff and notifications
      const previousOp = await tx.operation.findUnique({
        where: { id },
        select: { statut: true, montant: true, agencyId: true, type: true, agentId: true },
      });

      // 2. Set local RLS context securely using set_config
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${validateurId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${validateurRole}, true)`;

      // 3. Perform the update
      const operation = await tx.operation.update({
        where: { id },
        data: {
          statut,
          validateurId,
        }
      });

      // 4. Write audit log in the same transaction (atomic)
      await writeAuditLog(tx, {
        userId: validateurId,
        role: validateurRole,
        action: statut === 'VALIDEE' ? 'VALIDATE_OPERATION' : 'REJECT_OPERATION',
        tableName: 'Operation',
        recordId: id,
        oldData: previousOp ? { statut: previousOp.statut } : null,
        newData: { statut },
      });

      // 5. Notify the Agent who created the operation
      if (previousOp?.agentId) {
        await tx.notification.create({
          data: {
            userId: previousOp.agentId,
            title: statut === 'VALIDEE' ? 'Opération validée' : 'Opération rejetée',
            message: `Votre opération de ${previousOp.montant} FCFA a été ${statut.toLowerCase()}.`,
            type: statut === 'VALIDEE' ? 'SUCCESS' : 'ERROR',
            operationId: operation.id,
          }
        });
      }

      return operation;
    });
  }

  static async delete(id: string, agentId: string, role: string) {
    // Sécurité : Les agents de saisie ne peuvent jamais supprimer
    const AGENT_ONLY_ROLES = ['AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE', 'AUTRE'];
    if (AGENT_ONLY_ROLES.includes(role)) {
      throw new Error("Permission refusée. Les agents de saisie ne peuvent pas supprimer une opération.");
    }
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current to check status
      const op = await tx.operation.findUnique({ where: { id } });
      if (!op) throw new Error("Opération introuvable");
      if (op.statut === "VALIDEE" && role !== 'PDG' && role !== 'DG') {
        throw new Error("Impossible de supprimer une opération validée.");
      }

      // 2. RLS Context
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${agentId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${role}, true)`;

      // 3. Delete
      const deletedOp = await tx.operation.delete({ where: { id } });

      // 4. Audit
      await writeAuditLog(tx, {
        userId: agentId,
        role: role,
        action: 'DELETE_OPERATION',
        tableName: 'Operation',
        recordId: id,
        oldData: { montant: deletedOp.montant, type: deletedOp.type, statut: deletedOp.statut },
        newData: null,
      });

      return deletedOp;
    });
  }

  static async cancel(id: string, agentId: string, role: string) {
    // Sécurité : Les agents de saisie ne peuvent jamais annuler
    const AGENT_ONLY_ROLES = ['AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE', 'AUTRE'];
    if (AGENT_ONLY_ROLES.includes(role)) {
      throw new Error("Permission refusée. Les agents de saisie ne peuvent pas annuler une opération.");
    }
    return prisma.$transaction(async (tx) => {
      const op = await tx.operation.findUnique({ where: { id } });
      if (!op) throw new Error("Opération introuvable");

      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${agentId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${role}, true)`;

      const cancelledOp = await tx.operation.update({
        where: { id },
        data: { statut: "ANNULEE" }
      });

      await writeAuditLog(tx, {
        userId: agentId,
        role: role,
        action: 'CANCEL_OPERATION',
        tableName: 'Operation',
        recordId: id,
        oldData: { statut: op.statut },
        newData: { statut: "ANNULEE" },
      });

      return cancelledOp;
    });
  }

  static async update(id: string, data: any, agentId: string, role: string) {
    // Sécurité : Les agents de saisie ne peuvent jamais modifier
    const AGENT_ONLY_ROLES = ['AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE', 'AUTRE'];
    if (AGENT_ONLY_ROLES.includes(role)) {
      throw new Error("Permission refusée. Les agents de saisie ne peuvent pas modifier une opération.");
    }
    return prisma.$transaction(async (tx) => {
      const op = await tx.operation.findUnique({ where: { id } });
      if (!op) throw new Error("Opération introuvable");

      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${agentId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${role}, true)`;

      const updatedOp = await tx.operation.update({
        where: { id },
        data
      });

      await writeAuditLog(tx, {
        userId: agentId,
        role: role,
        action: 'UPDATE_OPERATION',
        tableName: 'Operation',
        recordId: id,
        oldData: { montant: op.statut, commentaire: op.commentaire, statut: op.statut },
        newData: data,
      });

      return updatedOp;
    });
  }

  // --- BULK ACTIONS ---

  static async bulkUpdateStatus(ids: string[], statut: "VALIDEE" | "REJETEE" | "VALIDEE_DG", validateurId: string, validateurRole: string = 'DGA') {
    return prisma.$transaction(async (tx) => {
      const previousOps = await tx.operation.findMany({
        where: { id: { in: ids } },
        select: { id: true, statut: true, montant: true, agencyId: true, type: true, agentId: true },
      });

      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${validateurId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${validateurRole}, true)`;

      await tx.operation.updateMany({
        where: { id: { in: ids } },
        data: { statut, validateurId }
      });

      await writeAuditLog(tx, {
        userId: validateurId,
        role: validateurRole,
        action: statut === 'VALIDEE' ? 'BULK_VALIDATE' : 'BULK_REJECT',
        tableName: 'Operation',
        recordId: 'BULK',
        oldData: { count: ids.length, ids },
        newData: { statut },
      });

      const notifications = previousOps.filter(op => op.agentId).map(op => ({
        userId: op.agentId!,
        title: statut === 'VALIDEE' ? 'Opération validée' : 'Opération rejetée',
        message: `Votre opération de ${op.montant} FCFA a été ${statut.toLowerCase()}.`,
        type: statut === 'VALIDEE' ? 'SUCCESS' : 'ERROR',
        operationId: op.id,
      }));

      if (notifications.length > 0) {
        await tx.notification.createMany({ data: notifications });
      }

      return previousOps;
    });
  }

  static async bulkDelete(ids: string[], agentId: string, role: string) {
    const AGENT_ONLY_ROLES = ['AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE', 'AUTRE'];
    if (AGENT_ONLY_ROLES.includes(role)) throw new Error("Permission refusée.");

    return prisma.$transaction(async (tx) => {
      const ops = await tx.operation.findMany({ where: { id: { in: ids } } });
      if (ops.some(op => op.statut === "VALIDEE") && role !== 'PDG' && role !== 'DG') {
        throw new Error("Impossible de supprimer des opérations validées.");
      }

      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${agentId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${role}, true)`;

      const { count } = await tx.operation.deleteMany({ where: { id: { in: ids } } });

      await writeAuditLog(tx, {
        userId: agentId,
        role: role,
        action: 'BULK_DELETE',
        tableName: 'Operation',
        recordId: 'BULK',
        oldData: { count, ids },
        newData: null,
      });

      return { count };
    });
  }

  static async bulkCancel(ids: string[], agentId: string, role: string) {
    const AGENT_ONLY_ROLES = ['AGENT', 'CAISSIER', 'DGA', 'CHEF_AGENCE', 'COMPTABLE', 'SECRETAIRE', 'AUTRE'];
    if (AGENT_ONLY_ROLES.includes(role)) throw new Error("Permission refusée.");

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${agentId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${role}, true)`;

      const { count } = await tx.operation.updateMany({
        where: { id: { in: ids } },
        data: { statut: "ANNULEE" }
      });

      await writeAuditLog(tx, {
        userId: agentId,
        role: role,
        action: 'BULK_CANCEL',
        tableName: 'Operation',
        recordId: 'BULK',
        oldData: { ids },
        newData: { statut: "ANNULEE" },
      });

      return { count };
    });
  }
}
