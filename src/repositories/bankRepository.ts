import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/auditService";

export class BankRepository {
  static async findAll() {
    return prisma.bank.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findActive() {
    return prisma.bank.findMany({
      where: { isActive: true, isDeleted: false },
      orderBy: { nom: 'asc' }
    });
  }

  static async findById(id: string) {
    return prisma.bank.findUnique({ where: { id } });
  }

  static async create(data: any, authorId: string) {
    const { objectifMensuel, ...bankData } = data;
    return prisma.$transaction(async (tx) => {
      const bank = await tx.bank.create({ data: bankData });
      
      if (objectifMensuel) {
        const date = new Date();
        const premierJour = new Date(date.getFullYear(), date.getMonth(), 1);
        const dernierJour = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let parsedObjectif = parseInt(objectifMensuel, 10);
        if (isNaN(parsedObjectif)) parsedObjectif = 0;
        if (parsedObjectif > 2147483647) parsedObjectif = 2147483647;

        if (parsedObjectif > 0) {
          await tx.bankObjective.create({
            data: {
              bankId: bank.id,
              montant: parsedObjectif,
              dateDebut: premierJour,
              dateFin: dernierJour
            }
          });
        }
      }

      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "CREATE_BANK",
        tableName: "Bank",
        recordId: bank.id,
        newData: bank as any
      });
      
      return bank;
    });
  }

  static async update(id: string, data: any, authorId: string) {
    const oldBank = await this.findById(id);
    return prisma.$transaction(async (tx) => {
      const bank = await tx.bank.update({
        where: { id },
        data
      });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "UPDATE_BANK",
        tableName: "Bank",
        recordId: bank.id,
        oldData: oldBank as any,
        newData: bank as any
      });
      
      return bank;
    });
  }

  static async delete(id: string, authorId: string) {
    const oldBank = await prisma.bank.findUnique({ where: { id } });
    if (!oldBank) throw new Error("Banque introuvable");
    
    return prisma.$transaction(async (tx) => {
      // also delete objective
      await tx.bankObjective.deleteMany({ where: { bankId: id } });
      const bank = await tx.bank.update({
        where: { id },
        data: { isDeleted: true, isActive: false }
      });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "ARCHIVE_BANK",
        tableName: "Bank",
        recordId: id,
        oldData: oldBank as any,
        newData: { isDeleted: true }
      });
      
      return bank;
    });
  }
}
