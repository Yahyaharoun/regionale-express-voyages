"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  getUnreadNotificationsAction, 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction 
} from "@/actions/notificationActions";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Ref pour stocker la fonction d'unsubscription FCM foreground
  const fcmUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 1. Charger les notifications initiales
    const fetchNotifications = async () => {
      const { data } = await getUnreadNotificationsAction();
      if (data) {
        setNotifications(data as any[]);
        setUnreadCount(data.length);
      }
    };
    fetchNotifications();

    // 2. Initialiser le listener foreground Firebase UNE SEULE FOIS
    // et conserver la fonction de nettoyage pour éviter les memory leaks
    import("@/lib/firebase/client").then(({ onForegroundMessage, sendConfigToServiceWorker }) => {
      // Envoyer la config Firebase au SW pour éviter la race condition
      sendConfigToServiceWorker().catch(console.warn);

      // S'abonner aux messages foreground et conserver l'unsubscribe
      if (!fcmUnsubscribeRef.current) {
        const unsubscribe = onForegroundMessage();
        if (unsubscribe) {
          fcmUnsubscribeRef.current = unsubscribe;
        }
      }
    });

    // 3. Souscrire aux changements Supabase Realtime
    const supabase = createClient();
    const channelId = `realtime-notif-${userId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Toast de notification in-app
          toast(newNotif.title, {
            description: newNotif.message,
            icon: newNotif.type === "SUCCESS" ? "✅" : newNotif.type === "ERROR" ? "❌" : "ℹ️",
          });

          // Son de notification (Web Audio API — ne nécessite pas de permission)
          try {
            const { playNotificationSound } = await import("@/lib/notification-sounds");
            await playNotificationSound();
          } catch {
            // Silencieux si le son échoue (ex: politique navigateur)
          }
        }
      )
      .subscribe();

    // 4. Nettoyage à la destruction du composant
    return () => {
      // Désabonner le canal Supabase
      supabase.removeChannel(channel);
      // Désabonner le listener FCM foreground pour éviter les memory leaks
      if (fcmUnsubscribeRef.current) {
        fcmUnsubscribeRef.current();
        fcmUnsubscribeRef.current = null;
      }
    };
  }, [userId]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsReadAction(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await markAllNotificationsAsReadAction();
  };

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 relative text-muted-foreground hover:text-foreground">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-in zoom-in"></span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
              <Check className="mr-1 h-3 w-3" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              Aucune notification
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm leading-none">{notif.title}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug mt-1">
                    {notif.message}
                  </p>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleMarkAsRead(notif.id)}>
                      Marquer comme lu
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
