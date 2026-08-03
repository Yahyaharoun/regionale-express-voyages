import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export class NotificationRepository {
  /**
   * Récupérer les notifications non lues d'un utilisateur
   */
  static async getUnreadNotifications(userId: string) {
    return unstable_cache(
      async () => {
        return prisma.notification.findMany({
          where: { userId, isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      },
      [`notifications-${userId}-unread`],
      { tags: [`notifications-${userId}`] }
    )();
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
