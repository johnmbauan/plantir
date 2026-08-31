import supabase from "@/supabase";
import { GARDEN_PROFILE_PATH } from "@/constants/achievements";
import { DASHBOARD_PATH } from "@/constants/routes";
import { fetchPlantStatusesByIds } from "@/services/plantService";
import type { PlantStatus } from "@/types";
import { evaluateAndToastUnlocks, recordClientEvent, showUnlockToasts } from "@/services/achievementService";
import { requireUser } from "@/utils/requireUser";

export interface NotificationSettings {
  id: number;
  telegram_chat_id: string;
  notification_hour: number;
  notification_timezone: string;
  browser_notifications_enabled: boolean;
  locale: string;
  weather_lat?: number | null;
  weather_lng?: number | null;
}

export type NotificationType = "watering" | "offline" | "achievement" | "onboardingCompleted";

export const NOTIFICATIONS_CHANGED_EVENT = "plantir-notifications-changed";

export interface WateringPayload {
  plantId: number;
  plantName: string;
  humidity: number;
  imageUrl: string | null;
  rain_forecasted?: boolean;
}

export interface OfflinePlantPayload {
  plantId: number;
  plantName: string;
  lastSeenAt: string | null;
}

export interface OfflinePayload {
  plants: OfflinePlantPayload[];
  notificationTimezone?: string;
}

export interface AchievementPayload {
  achievementKey: string;
  garden_element: string;
}

export interface OnboardingPayload {
  kind: "complete";
}

export type NotificationPayload =
  | WateringPayload
  | OfflinePayload
  | AchievementPayload
  | OnboardingPayload;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: NotificationPayload;
  created_at: string;
}

export function isWateringPayload(payload: NotificationPayload): payload is WateringPayload {
  return "plantId" in payload && !("plants" in payload);
}

export function isOfflinePayload(payload: NotificationPayload): payload is OfflinePayload {
  return "plants" in payload;
}

export function isAchievementPayload(payload: NotificationPayload): payload is AchievementPayload {
  return "achievementKey" in payload;
}

export function isOnboardingPayload(payload: NotificationPayload): payload is OnboardingPayload {
  return "kind" in payload && payload.kind === "complete";
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

export interface TelegramChatInfo {
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export type TelegramLookupErrorCode = "invalid_chat_id" | "chat_not_found" | "bot_not_in_chat" | "telegram_error" | "unknown";

export async function lookupTelegramChat(chatId: string): Promise<TelegramChatInfo> {
  const { data, error } = await supabase.functions.invoke("telegram-chat-lookup", {
    body: { chatId },
  });

  if (error) {
    const code = (data as { error?: string } | null)?.error as TelegramLookupErrorCode | undefined;
    throw Object.assign(new Error(code ?? "unknown"), { code: code ?? "unknown" });
  }

  const payload = data as { error?: TelegramLookupErrorCode } & TelegramChatInfo;
  if (payload.error) {
    throw Object.assign(new Error(payload.error), { code: payload.error });
  }

  return payload as TelegramChatInfo;
}

export async function fetchSettings(): Promise<NotificationSettings | null> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("notification_settings")
    .select(
      "id, telegram_chat_id, notification_hour, notification_timezone, browser_notifications_enabled, locale, weather_lat, weather_lng",
    )
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
  const user = await requireUser();

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

  try {
    const newly = await recordClientEvent("notification_settings_saved");
    showUnlockToasts(newly);
  } catch (err) {
    console.error("Failed to record notification_settings_saved achievement event:", err);
  }
}

export async function updateLocale(locale: string): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("notification_settings")
    .update({ locale, updatedAt: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function updateWeatherLocation(lat: number, lng: number): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("notification_settings")
    .update({
      weather_lat: lat,
      weather_lng: lng,
      updatedAt: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function snoozeNotification(plantId: number, hours: 24 | 48): Promise<void> {
  const user = await requireUser();

  const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("plant_notification_snooze")
    .upsert(
      {
        user_id: user.id,
        plant_id: plantId,
        snoozed_until: snoozedUntil,
      },
      { onConflict: "user_id,plant_id" },
    );

  if (error) throw error;
}

export async function fetchActiveSnoozedPlants(): Promise<Map<number, string>> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("plant_notification_snooze")
    .select("plant_id, snoozed_until")
    .eq("user_id", user.id)
    .gt("snoozed_until", new Date().toISOString());

  if (error) throw error;

  const map = new Map<number, string>();
  for (const row of data ?? []) {
    map.set(row.plant_id as number, row.snoozed_until as string);
  }
  return map;
}

export async function unsnoozeNotification(plantId: number): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("plant_notification_snooze")
    .delete()
    .eq("user_id", user.id)
    .eq("plant_id", plantId);

  if (error) throw error;
}

export async function fetchUnreadNotifications(): Promise<AppNotification[]> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, payload, created_at")
    .eq("user_id", user.id)
    .is("read_at", null)
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as AppNotification[];
}

function collectPlantIdsFromNotifications(notifications: AppNotification[]): number[] {
  const ids = new Set<number>();

  for (const notification of notifications) {
    if (notification.type === "watering" && isWateringPayload(notification.payload)) {
      ids.add(notification.payload.plantId);
    } else if (notification.type === "offline" && isOfflinePayload(notification.payload)) {
      for (const plant of notification.payload.plants) {
        ids.add(plant.plantId);
      }
    }
  }

  return [...ids];
}

export async function autoResolveNotifications(notifications: AppNotification[]): Promise<AppNotification[]> {
  if (notifications.length === 0) return [];

  const plantIds = collectPlantIdsFromNotifications(notifications);
  const statusByPlantId = plantIds.length > 0
    ? await fetchPlantStatusesByIds(plantIds)
    : new Map<number, PlantStatus[]>();
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
  const remaining = notifications.filter((n) => !resolvedIds.has(n.id));

  if (toResolve.length > 0) {
    void evaluateAndToastUnlocks();
  }

  return remaining;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)
    .is("resolved_at", null);

  if (error) throw error;

  try {
    const newly = await recordClientEvent("inbox_cleared");
    showUnlockToasts(newly);
  } catch (err) {
    console.error("Failed to record inbox_cleared achievement event:", err);
  }
}

export function getNotificationHref(notification: AppNotification): string {
  if (notification.type === "achievement") return GARDEN_PROFILE_PATH;
  if (notification.type === "onboardingCompleted") return DASHBOARD_PATH;
  if (notification.type === "offline") return "/plants-center?tab=devices";
  if (isWateringPayload(notification.payload)) {
    return `${DASHBOARD_PATH}?highlightPlant=${notification.payload.plantId}`;
  }
  return DASHBOARD_PATH;
}
