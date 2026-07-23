import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUnreadNotifications,
  resolveStaleNotifications,
  type AppNotification,
} from "@/services/notificationService";

const POLL_INTERVAL_MS = 30 * 60 * 1000;

export function useNotifications() {
  const { session } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeAvailable, setRealtimeAvailable] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const unread = await fetchUnreadNotifications();
      setItems(unread);
      setLoading(false);

      // Auto-resolve in the background so the inbox paints without waiting on plant statuses.
      const remaining = await resolveStaleNotifications(unread);
      setItems(remaining);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setLoading(false);
    }
  }, [session]);

  const handleIncoming = useCallback((notification: AppNotification) => {
    setItems((current) => {
      if (current.some((item) => item.id === notification.id)) return current;
      return [notification, ...current];
    });

    // Achievement unlocks already toast from evaluate/client-event responses.
    if (document.hasFocus() && notification.type !== "achievement") {
      notifications.show({
        title: notification.title,
        message: notification.body.split("\n")[0],
        color: notification.type === "watering" ? "yellow" : "red",
        autoClose: 8000,
      });
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    // Defer so the initial fetch's setState is not synchronous inside this effect.
    const loadTimer = window.setTimeout(() => {
      void refresh();
    }, 0);

    const userId = session.user.id;
    const channelName = `user:${userId}`;

    void supabase.realtime.setAuth(session.access_token);

    const channel = supabase
      .channel(channelName, { config: { private: true } })
      .on("broadcast", { event: "notification_created" }, (message) => {
        const payload = message.payload as AppNotification;
        if (!payload?.id) return;
        handleIncoming(payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeAvailable(true);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeAvailable(false);
        }
      });

    return () => {
      window.clearTimeout(loadTimer);
      void supabase.removeChannel(channel);
    };
  }, [session, refresh, handleIncoming]);

  useEffect(() => {
    if (!session?.user || realtimeAvailable) return;

    const pollTimer = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(pollTimer);
  }, [session, realtimeAvailable, refresh]);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const signedIn = Boolean(session?.user);
  const visibleItems = signedIn ? items : [];
  const visibleLoading = signedIn ? loading : false;

  return {
    items: visibleItems,
    loading: visibleLoading,
    unreadCount: visibleItems.length,
    refresh,
    removeItem,
    clearAll,
  };
}
