import type { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import type { OfflineRow, WateringRow } from "./types.ts";
import { OFFLINE_QUERY, WATERING_QUERY } from "./queries.ts";
import { getEffectiveHumidity } from "./effectiveHumidity.ts";
import { loadRainForecastsByCoords, rainNoteText } from "./weather.ts";
import { sendTelegramMessage, sendTelegramPhoto } from "./telegram.ts";
import { createInAppNotification } from "./notifications.ts";
import {
  offlineInAppCopy,
  offlinePlantLine,
  offlineTelegramText,
  resolveLocale,
  wateringInAppCopy,
  wateringTelegramCaption,
} from "./i18n.ts";

async function loadSnoozedPlantIds(
  connection: PoolClient,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const { rows } = await connection.queryObject<{ userId: string; plantId: number }>(
    `SELECT user_id AS "userId", plant_id AS "plantId"
     FROM plant_notification_snooze
     WHERE user_id = ANY($1::uuid[])
       AND snoozed_until > now()`,
    [userIds],
  );

  return new Set(rows.map((r) => `${r.userId}:${Number(r.plantId)}`));
}

export interface WateringAlertResult {
  plant: string;
  humidity: number;
  telegram: boolean;
  browser: boolean;
  rainNote: boolean;
}

export async function sendWateringAlerts(
  connection: PoolClient,
  botToken: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<WateringAlertResult[]> {
  const { rows } = await connection.queryObject<WateringRow>(WATERING_QUERY);
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const [snoozedKeys, rainByCoords] = await Promise.all([
    loadSnoozedPlantIds(connection, userIds),
    loadRainForecastsByCoords(rows),
  ]);

  const alerts: WateringAlertResult[] = [];

  for (const row of rows) {
    const plantKey = `${row.userId}:${Number(row.plantId)}`;
    if (snoozedKeys.has(plantKey)) continue;

    const humidity = getEffectiveHumidity(Number(row.humidity), row.potDepthClass);
    if (humidity > Number(row.minHumidityThreshold)) continue;

    let rainForecasted = false;
    let rainNote = "";
    if (row.isOutdoor && row.weatherLat != null && row.weatherLng != null) {
      const forecast = rainByCoords.get(`${Number(row.weatherLat)},${Number(row.weatherLng)}`);
      if (forecast && (forecast.isRainForcastedForToday || forecast.isRainForcastedForTomorrow)) {
        rainForecasted = true;
        rainNote = rainNoteText(forecast, row.locale);
      }
    }

    const locale = resolveLocale(row.locale);
    const caption = wateringTelegramCaption(locale, row.plantName, humidity, rainNote);

    let telegram = false;
    let browser = false;

    if (row.chatId) {
      try {
        if (row.imageUrl) {
          await sendTelegramPhoto(botToken, row.chatId, row.imageUrl, caption);
        } else {
          await sendTelegramMessage(botToken, row.chatId, caption);
        }
        telegram = true;
      } catch {
        telegram = false;
      }
    }

    if (row.browserEnabled) {
      const { title, body } = wateringInAppCopy(locale, row.plantName, humidity, rainNote);
      const payload = {
        plantId: Number(row.plantId),
        plantName: row.plantName,
        humidity,
        imageUrl: row.imageUrl,
        rain_forecasted: rainForecasted || undefined,
      };
      const id = await createInAppNotification(
        connection,
        supabaseUrl,
        serviceRoleKey,
        row.userId,
        "watering",
        title,
        body,
        payload,
      );
      browser = id !== null;
    }

    alerts.push({ plant: row.plantName, humidity, telegram, browser, rainNote: rainForecasted });
  }

  return alerts;
}

export interface OfflineAlertResult {
  plant: string;
  telegram: boolean;
  browser: boolean;
}

export async function sendOfflineAlerts(
  connection: PoolClient,
  botToken: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<OfflineAlertResult[]> {
  const { rows } = await connection.queryObject<OfflineRow>(OFFLINE_QUERY);
  if (rows.length === 0) return [];

  const byTelegramChat = new Map<string, OfflineRow[]>();
  const byUserId = new Map<string, OfflineRow[]>();

  for (const row of rows) {
    if (row.chatId) {
      const list = byTelegramChat.get(row.chatId) ?? [];
      list.push(row);
      byTelegramChat.set(row.chatId, list);
    }
    if (row.browserEnabled) {
      const list = byUserId.get(row.userId) ?? [];
      list.push(row);
      byUserId.set(row.userId, list);
    }
  }

  const notified: OfflineAlertResult[] = [];

  for (const [chatId, plants] of byTelegramChat) {
    const locale = resolveLocale(plants[0].locale);
    const lines = plants.map((r) =>
      offlinePlantLine(locale, r.plantName, r.lastSeenAt, r.notificationTimezone)
    );

    await sendTelegramMessage(botToken, chatId, offlineTelegramText(locale, lines));
    for (const r of plants) {
      notified.push({ plant: r.plantName, telegram: true, browser: false });
    }
  }

  for (const [userId, plants] of byUserId) {
    const locale = resolveLocale(plants[0].locale);
    const lines = plants.map((r) =>
      offlinePlantLine(locale, r.plantName, r.lastSeenAt, r.notificationTimezone)
    );
    const { title, body } = offlineInAppCopy(
      locale,
      plants.map((r) => r.plantName),
      lines,
    );

    const payload = {
      plants: plants.map((r) => ({
        plantId: Number(r.plantId),
        plantName: r.plantName,
        lastSeenAt: r.lastSeenAt,
      })),
      notificationTimezone: plants[0].notificationTimezone,
    };

    const id = await createInAppNotification(
      connection,
      supabaseUrl,
      serviceRoleKey,
      userId,
      "offline",
      title,
      body,
      payload,
    );

    for (const r of plants) {
      const existing = notified.find((n) => n.plant === r.plantName);
      if (existing) {
        existing.browser = id !== null;
      } else {
        notified.push({ plant: r.plantName, telegram: false, browser: id !== null });
      }
    }
  }

  return notified;
}
