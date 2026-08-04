import { adminMessaging } from "./admin";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string; // Deep link
  eventId?: string;
  eventType: string; // ex: EXPENSE_CREATED, DEPOSIT_VALIDATED, TARGET_REACHED
};

export async function sendPushNotification(
  payload: NotificationPayload,
  targetRoles: Role[] = [],
  targetUserId?: string,
  targetAgencyId?: string
) {
  try {
    // Si FCM n'est pas initialisé (pas de clés), on quitte silencieusement.
    // Le mode "dégradé" (notifications internes) fonctionnera toujours.
    if (!adminMessaging) {
      console.warn("FCM non configuré, notification push ignorée.");
      return { success: false, reason: "NOT_CONFIGURED" };
    }

    // Construire la requête pour trouver les utilisateurs cibles
    const whereClause: any = { OR: [] };

    // 1. PDG reçoit toujours les alertes importantes s'il est ciblé par son rôle
    if (targetRoles.length > 0) {
      whereClause.OR.push({ role: { in: targetRoles } });
    }

    // 2. Utilisateur spécifique (ex: l'agent qui a créé la dépense validée par le DG)
    if (targetUserId) {
      whereClause.OR.push({ id: targetUserId });
    }

    if (whereClause.OR.length === 0) return { success: false, reason: "NO_TARGETS" };

    const targetUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        deviceTokens: {
          where: { isActive: true }
        }
      }
    });

    const tokensToNotify: string[] = [];
    const userIdsNotified: string[] = [];

    for (const user of targetUsers) {
      // Cloisonnement : si l'utilisateur est AGENT, il ne reçoit pas si c'est pour une autre agence
      if (
        user.role !== "PDG" &&
        user.role !== "DG" &&
        targetAgencyId &&
        user.agencyId !== targetAgencyId
      ) {
        // C'est un agent d'une autre agence, on ignore (Sécurité RLS)
        if (user.id !== targetUserId) { // Sauf si explicitement ciblé
          continue;
        }
      }

      if (user.deviceTokens.length > 0) {
        user.deviceTokens.forEach(dt => tokensToNotify.push(dt.token));
        userIdsNotified.push(user.id);
      }
    }

    if (tokensToNotify.length === 0) {
      return { success: false, reason: "NO_ACTIVE_TOKENS" };
    }

    // Construction du message FCM complet avec bloc webpush
    // IMPORTANT : le bloc "webpush" est OBLIGATOIRE pour que les navigateurs
    // web et PWA affichent réellement la notification. Sans ce bloc,
    // FCM envoie le message mais le navigateur l'ignore silencieusement.
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      // Configuration pour navigateurs web / PWA (Chrome, Firefox, Edge, Samsung Internet)
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          vibrate: [500, 250, 500, 250, 500],
          requireInteraction: true,
          tag: payload.eventType,
          renotify: true,
        },
        fcmOptions: {
          link: payload.url || "/dashboard"
        },
        // Headers pour haute priorité (contournement mode batterie Android)
        headers: {
          Urgency: "high",
          TTL: "86400",
        }
      },
      // Configuration pour Android natif
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          defaultVibrateTimings: true,
          defaultSound: true,
          channelId: "rex-alerts"
        }
      },
      // Configuration pour iOS natif
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true
          }
        },
        headers: {
          "apns-priority": "10"
        }
      },
      data: {
        url: payload.url || "/dashboard",
        eventId: payload.eventId || "",
        eventType: payload.eventType
      },
      tokens: tokensToNotify,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    // Nettoyage des tokens invalides (désinstallés, expirés)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`[FCM] Token invalide : ${resp.error?.message}`);
          failedTokens.push(tokensToNotify[idx]);
        }
      });

      if (failedTokens.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: failedTokens } }
        });
      }
    }

    // Journal d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: "PUSH_SENT",
          role: "SYSTEM",
          tableName: "DeviceToken",
          recordId: payload.eventType,
          newData: {
            title: payload.title,
            successCount: response.successCount,
            failureCount: response.failureCount,
            targets: userIdsNotified
          }
        }
      });
    } catch(e) {
      console.error("Erreur lors de la sauvegarde de l'audit Push", e);
    }

    return { success: true, sentCount: response.successCount };
  } catch (error) {
    console.error("Erreur FCM sendPushNotification:", error);
    return { success: false, error };
  }
}
