import supabase from "@/supabase";
import { fetchPlantStatusById } from "@/services/plantService";
import type { PlantStatus } from "@/types";

export interface NotificationSettings {
  id: number;
  telegram_chat_id: string;
  notification_hour: number;
  notification_timezone: string;
  browser_notifications_enabled: boolean;
}

export type NotificationType = "watering" | "offline";

export interface WateringPayload {
  plantId: number;
  plantName: string;
  humidity: number;
  imageUrl: string | null;
}

export interface OfflinePlantPayload {
  plantId: number;
  plantName: string;
  lastSeenAt: string | null;
}

export interface OfflinePayload {
  plants: OfflinePlantPayload[];
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: WateringPayload | OfflinePayload;
  created_at: string;
}

function isWateringPayload(payload: WateringPayload | OfflinePayload): payload is WateringPayload {
  return "plantId" in payload && !("plants" in payload);
}

function isOfflinePayload(payload: WateringPayload | OfflinePayload): payload is OfflinePayload {
  return "plants" in payload;
}

function shouldResolveNotification(
  notification: AppNotification,
  statusByPlantId: Map<number, PlantStatus[]>,
): boolean {
  if (notification.type === "watering" && isWateringPayload(notification.payload)) {
    const statuses = statusByPlantId.get(notification.payload.plantId) ?? [];
    return !statuses.includes("WATERING_NEEDED");
  }

  if (notification.type === "offline" && isOfflinePayload(notification.payload)) {
    return notification.payload.plants.every((plant) => {
      const statuses = statusByPlantId.get(plant.plantId) ?? [];
      return !statuses.includes("OFFLINE");
    });
  }

  return false;
}

export async function fetchSettings(): Promise<NotificationSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notification_settings")
    .select("id, telegram_chat_id, notification_hour, notification_timezone, browser_notifications_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertSettings(
  telegram_chat_id: string,
  notification_hour: number,
  notification_timezone: string,
  browser_notifications_enabled: boolean,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notification_settings")
    .upsert(
      {
        user_id: user.id,
        telegram_chat_id,
        notification_hour,
        notification_timezone,
        browser_notifications_enabled,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}

export async function fetchUnreadNotifications(): Promise<AppNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, payload, created_at")
    .eq("user_id", user.id)
    .is("read_at", null)
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const notifications = (data ?? []) as AppNotification[];
  return autoResolveNotifications(notifications);
}

async function autoResolveNotifications(notifications: AppNotification[]): Promise<AppNotification[]> {
  if (notifications.length === 0) return [];

  const statusByPlantId = await fetchPlantStatusById();
  const toResolve = notifications.filter((n) => shouldResolveNotification(n, statusByPlantId));

  if (toResolve.length > 0) {
    const now = new Date().toISOString();
    await Promise.all(
      toResolve.map((n) =>
        supabase
          .from("notifications")
          .update({ resolved_at: now })
          .eq("id", n.id),
      ),
    );
  }

  const resolvedIds = new Set(toResolve.map((n) => n.id));
  return notifications.filter((n) => !resolvedIds.has(n.id));
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)
    .is("resolved_at", null);

  if (error) throw error;
}

export function getNotificationHref(notification: AppNotification): string {
  if (notification.type === "offline") return "/plants-center?tab=devices";
  return "/";
}
