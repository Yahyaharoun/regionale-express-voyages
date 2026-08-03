"use server";

import { revalidatePath } from "next/cache";
import { NotificationRepository } from "@/repositories/notificationRepository";
import { getCurrentUser } from "@/lib/auth";

export async function getUnreadNotificationsAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: "Non authentifié" };

    const notifications = await NotificationRepository.getUnreadNotifications(user.userId);
    return { data: notifications, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Erreur lors de la récupération des notifications" };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non authentifié" };

    await NotificationRepository.markAsRead(notificationId, user.userId);
    revalidatePath("/dashboard", "layout");
    
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la mise à jour" };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Non authentifié" };

    await NotificationRepository.markAllAsRead(user.userId);
    revalidatePath("/dashboard", "layout");
    
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la mise à jour" };
  }
}

export async function testPushNotification(token: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const { adminMessaging } = await import('@/lib/firebase/admin');
    
    if (!adminMessaging) {
      await import('@/lib/prisma').then(({ prisma }) => {
        return prisma.auditLog.create({
          data: {
            userId: user.userId,
            role: user.role,
            action: 'PUSH_TEST_FAILED',
            tableName: 'DeviceToken',
            recordId: token,
            newData: { error: "Firebase Admin non initialisé" } as any
          }
        });
      });
      return { success: false, error: "Firebase Admin n'est pas initialisé sur le serveur." };
    }

    const message = {
      notification: {
        title: "Test Réussi ! 🎉",
        body: "Votre appareil est correctement configuré pour recevoir les notifications de REGIONALE EXPRESS VOYAGES SARL."
      },
      token: token
    };

    const response = await adminMessaging.send(message);

    await import('@/lib/prisma').then(({ prisma }) => {
      return prisma.auditLog.create({
        data: {
          userId: user.userId,
          role: user.role,
          action: 'PUSH_TEST_SUCCESS',
          tableName: 'DeviceToken',
          recordId: token,
          newData: { messageId: response } as any
        }
      });
    });

    return { success: true, messageId: response };
  } catch (error: any) {
    console.error("Error sending test push:", error);
    
    // Log failure
    try {
      const user = await getCurrentUser();
      if (user) {
        await import('@/lib/prisma').then(({ prisma }) => {
          return prisma.auditLog.create({
            data: {
              userId: user.userId,
              role: user.role,
              action: 'PUSH_TEST_FAILED',
              tableName: 'DeviceToken',
              recordId: token,
              newData: { error: error.message } as any
            }
          });
        });
      }
    } catch(e) {}

    return { success: false, error: error.message || "Erreur lors de l'envoi de la notification" };
  }
}
