import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  autoResolveNotifications,
  fetchUnreadNotifications,
  type AppNotification,
} from "@/services/notificationService";

const POLL_INTERVAL_MS = 30 * 60 * 1000;

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const accessToken = session?.access_token ?? null;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeAvailable, setRealtimeAvailable] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      const unread = await fetchUnreadNotifications();
      setItems(unread);
      setLoading(false);
      void autoResolveNotifications(unread)
        .then((resolved) => setItems(resolved))
        .catch((err) => console.error("Failed to auto-resolve notifications:", err));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setLoading(false);
    }
  }, [userId]);

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
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const unread = await fetchUnreadNotifications();
        if (cancelled) return;
        setItems(unread);
        setLoading(false);
        void autoResolveNotifications(unread)
          .then((resolved) => {
            if (!cancelled) setItems(resolved);
          })
          .catch((err) => console.error("Failed to auto-resolve notifications:", err));
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !accessToken) return;

    const channelName = `user:${userId}`;

    void supabase.realtime.setAuth(accessToken);

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
      void supabase.removeChannel(channel);
    };
  }, [userId, accessToken, handleIncoming]);

  useEffect(() => {
    if (!userId || realtimeAvailable) return;

    const pollTimer = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(pollTimer);
  }, [userId, realtimeAvailable, refresh]);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const signedIn = Boolean(userId);

  return {
    items: signedIn ? items : [],
    loading: signedIn ? loading : false,
    unreadCount: signedIn ? items.length : 0,
    realtimeAvailable,
    refresh,
    removeItem,
    clearAll,
  };
}
