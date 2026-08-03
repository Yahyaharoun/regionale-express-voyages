"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Helper function to parse user agent
function parseUserAgent(ua: string) {
  let browser = "Inconnu";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") || ua.includes("CriOS/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "Inconnu";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  const type = (ua.includes("Mobi") || ua.includes("Android") || ua.includes("iPhone")) ? "Mobile" : "Desktop";

  return { browser, os, type };
}

export async function registerDeviceToken(token: string, userAgent: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Non autorisé" };

    const { browser, os, type } = parseUserAgent(userAgent);
    const enrichedUserAgent = `${browser} sur ${os} (${type}) - ${userAgent}`;

    // Check if token already exists
    const existing = await prisma.deviceToken.findUnique({
      where: { token }
    });

    if (existing) {
      if (existing.userId !== user.userId) {
        // Token transferred to another user? Unlikely but handle it
        await prisma.deviceToken.update({
          where: { id: existing.id },
          data: { userId: user.userId, lastUsed: new Date(), isActive: true, userAgent: enrichedUserAgent }
        });
      } else {
        // Update lastUsed
        await prisma.deviceToken.update({
          where: { id: existing.id },
          data: { lastUsed: new Date(), isActive: true, userAgent: enrichedUserAgent }
        });
      }
    } else {
      // Create new token
      await prisma.deviceToken.create({
        data: {
          userId: user.userId,
          token,
          userAgent: enrichedUserAgent,
          isActive: true
        }
      });
      
      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          role: user.role,
          action: 'TOKEN_GENERATED',
          tableName: 'DeviceToken',
          recordId: token,
          newData: { os, browser, type } as any
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erreur registerDeviceToken:", error);
    return { success: false, error: error.message };
  }
}

export async function unregisterDeviceToken(token: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Non autorisé" };

    await prisma.deviceToken.delete({
      where: { token }
    });
    
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        role: user.role,
        action: 'TOKEN_DELETED',
        tableName: 'DeviceToken',
        recordId: token,
        oldData: { token } as any
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erreur unregisterDeviceToken:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserDevices() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Non autorisé" };

    const devices = await prisma.deviceToken.findMany({
      where: { userId: user.userId },
      orderBy: { lastUsed: 'desc' }
    });

    return { success: true, data: devices };
  } catch (error: any) {
    console.error("Erreur getUserDevices:", error);
    return { success: false, error: error.message };
  }
}
