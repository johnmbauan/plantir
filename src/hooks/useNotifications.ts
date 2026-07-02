import { useCallback, useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUnreadNotifications,
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
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const handleIncoming = useCallback((notification: AppNotification) => {
    setItems((current) => {
      if (current.some((item) => item.id === notification.id)) return current;
      return [notification, ...current];
    });

    if (document.hasFocus()) {
      notifications.show({
        title: notification.title,
        message: notification.body.split("\n")[0],
        color: notification.type === "watering" ? "yellow" : "red",
        autoClose: 8000,
      });
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setItems([]);
      setLoading(false);
      return;
    }

    let pollTimer: number | undefined;

    void refresh();

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
      if (pollTimer) window.clearInterval(pollTimer);
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

  return {
    items,
    loading,
    unreadCount: items.length,
    refresh,
    removeItem,
    clearAll,
  };
}
