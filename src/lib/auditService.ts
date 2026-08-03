import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface AuditParams {
  userId: string;
  role: string;
  action: string;
  tableName: string;
  recordId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

/**
 * Writes a single audit log entry.
 * Should be called inside a Prisma transaction for atomicity.
 */
export async function writeAuditLog(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: AuditParams
): Promise<void> {
  try {
    await tx.auditLog.create({
      data: {
        userId: params.userId,
        role: params.role,
        action: params.action,
        tableName: params.tableName,
        recordId: params.recordId,
        oldData: params.oldData as Prisma.InputJsonValue ?? Prisma.JsonNull,
        newData: params.newData as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    });
  } catch (err) {
    // Audit failure must not block the business operation, but it must be logged.
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}
