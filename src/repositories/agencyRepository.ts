import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { writeAuditLog } from "@/lib/auditService";

export class AgencyRepository {
  /**
   * Fetches all agencies including the count of associated users (agents).
   */
  static findAll = unstable_cache(
    async () => {
      return prisma.agency.findMany({
        orderBy: { nom: 'asc' },
        select: {
          id: true,
          nom: true,
          ville: true,
          isActive: true,
          responsable: true,
          telephone: true,
          _count: {
            select: { users: true }
          }
        }
      });
    },
    ['all-agencies'],
    { tags: ['agencies'], revalidate: 3600 * 24 }
  );

  /**
   * Creates a new agency and writes an audit log in the same transaction.
   */
  static async create(data: Prisma.AgencyCreateInput, createdByUserId: string) {
    return prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({ data });

      await writeAuditLog(tx, {
        userId: createdByUserId,
        role: 'PDG',
        action: 'CREATE_AGENCY',
        tableName: 'Agency',
        recordId: agency.id,
        oldData: null,
        newData: {
          nom: agency.nom,
          ville: agency.ville,
          adresse: agency.adresse,
          telephone: agency.telephone,
        },
      });

      return agency;
    });
  }

  /**
   * Updates an existing agency and writes an audit log.
   */
  static async update(id: string, data: Prisma.AgencyUpdateInput, authorId: string) {
    const oldAgency = await prisma.agency.findUnique({ where: { id } });
    return prisma.$transaction(async (tx) => {
      const agency = await tx.agency.update({
        where: { id },
        data
      });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "UPDATE_AGENCY",
        tableName: "Agency",
        recordId: agency.id,
        oldData: oldAgency as any,
        newData: agency as any
      });
      
      return agency;
    });
  }

  static async delete(id: string, authorId: string) {
    const oldAgency = await prisma.agency.findUnique({ where: { id } });
    if (!oldAgency) throw new Error("Agence introuvable");
    
    return prisma.$transaction(async (tx) => {
      const agency = await tx.agency.delete({
        where: { id }
      });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "DELETE_AGENCY",
        tableName: "Agency",
        recordId: id,
        oldData: oldAgency as any,
        newData: null
      });
      
      return agency;
    });
  }
}
