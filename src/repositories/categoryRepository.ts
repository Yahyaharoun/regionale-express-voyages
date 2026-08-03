import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/auditService";

export class CategoryRepository {
  static async findAll() {
    return prisma.category.findMany({
      orderBy: { nom: 'asc' }
    });
  }

  static async findActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { nom: 'asc' }
    });
  }

  static async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  static async create(data: any, authorId: string) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.create({ data });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "CREATE_CATEGORY",
        tableName: "Category",
        recordId: category.id,
        newData: category as any
      });
      
      return category;
    });
  }

  static async update(id: string, data: any, authorId: string) {
    const oldCategory = await this.findById(id);
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.update({
        where: { id },
        data
      });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "UPDATE_CATEGORY",
        tableName: "Category",
        recordId: category.id,
        oldData: oldCategory as any,
        newData: category as any
      });
      
      return category;
    });
  }

  static async delete(id: string, authorId: string) {
    const oldCategory = await prisma.category.findUnique({ where: { id } });
    if (!oldCategory) throw new Error("Catégorie introuvable");
    
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.delete({
        where: { id }
      });
      
      await writeAuditLog(tx, {
        userId: authorId,
        role: 'PDG',
        action: "DELETE_CATEGORY",
        tableName: "Category",
        recordId: id,
        oldData: oldCategory as any,
        newData: null
      });
      
      return category;
    });
  }
}
