import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import type { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WateringRow {
  userId: string;
  chatId: string;
  browserEnabled: boolean;
  plantId: number;
  plantName: string;
  imageUrl: string | null;
  humidity: number;
}

interface OfflineRow {
  userId: string;
  chatId: string;
  browserEnabled: boolean;
  plantId: number;
  plantName: string;
  lastSeenAt: string | null;
  notificationTimezone: string;
}

interface InsertedNotification {
  id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Queries — per-user notification settings; browser and Telegram decoupled
// ---------------------------------------------------------------------------

const CHANNEL_FILTER = `
  AND (
    ns.telegram_chat_id <> ''
    OR ns.browser_notifications_enabled = true
  )
  AND EXTRACT(HOUR FROM NOW() AT TIME ZONE ns.notification_timezone)::smallint = ns.notification_hour
`;

const WATERING_QUERY = `
  SELECT
    ns.user_id AS "userId",
    ns.telegram_chat_id AS "chatId",
    ns.browser_notifications_enabled AS "browserEnabled",
    p.id AS "plantId",
    p.name AS "plantName",
    p."imageUrl" AS "imageUrl",
    hm."humidityPercentage" AS "humidity"
  FROM (
    SELECT DISTINCT ON (hm."deviceId")
      hm."deviceId",
      hm."humidityPercentage"
    FROM humidity_measurements hm
    WHERE hm."createdAt" >= NOW() - INTERVAL '24 hours'
    ORDER BY hm."deviceId", hm."createdAt" DESC
  ) hm
  JOIN devices d ON d.id = hm."deviceId"
  JOIN plants p ON p.id = d."plantId"
  JOIN humidity_sensors_config hsc ON hsc."deviceId" = d.id
  JOIN notification_settings ns ON ns.user_id = d.user_id
  WHERE hm."humidityPercentage" <= hsc."minHumidityThreshold"
  ${CHANNEL_FILTER}
`;

const OFFLINE_QUERY = `
  SELECT
    ns.user_id AS "userId",
    ns.telegram_chat_id AS "chatId",
    ns.browser_notifications_enabled AS "browserEnabled",
    p.id AS "plantId",
    p.name AS "plantName",
    MAX(hm."createdAt") AS "lastSeenAt",
    ns.notification_timezone AS "notificationTimezone"
  FROM devices d
  JOIN plants p ON p.id = d."plantId"
  JOIN humidity_sensors_config hsc ON hsc."deviceId" = d.id
  JOIN notification_settings ns ON ns.user_id = d.user_id
  LEFT JOIN humidity_measurements hm ON hm."deviceId" = d.id
  WHERE true
  GROUP BY d.id, p.id, p.name, hsc."sleepDurationSeconds", ns.user_id, ns.telegram_chat_id,
    ns.browser_notifications_enabled, ns.notification_timezone, ns.notification_hour
  HAVING (
    MAX(hm."createdAt") IS NULL
    OR MAX(hm."createdAt") < NOW() - (hsc."sleepDurationSeconds" * 2 * INTERVAL '1 second')
  )
  ${CHANNEL_FILTER}
`;

// ---------------------------------------------------------------------------
// Serialization helpers — postgres bigint columns arrive as JS BigInt
// ---------------------------------------------------------------------------

function jsonStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? Number(v) : v));
}

// ---------------------------------------------------------------------------
// Telegram helpers
// ---------------------------------------------------------------------------

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const json = await res.json();
  if (!json.ok) console.error("Telegram sendMessage error:", json.description);
}

async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photo: string,
  caption: string,
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo, caption }),
  });
  const json = await res.json();
  if (!json.ok) console.error("Telegram sendPhoto error:", json.description);
}

// ---------------------------------------------------------------------------
// In-app notification helpers
// ---------------------------------------------------------------------------

async function findExistingNotification(
  connection: PoolClient,
  userId: string,
  type: "watering" | "offline",
  plantId?: number,
): Promise<InsertedNotification | null> {
  if (type === "watering" && plantId != null) {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `SELECT id, created_at FROM notifications
       WHERE user_id = $1 AND type = 'watering'
         AND read_at IS NULL AND resolved_at IS NULL
         AND (payload->>'plantId')::bigint = $2
       LIMIT 1`,
      [userId, plantId],
    );
    return rows[0] ?? null;
  }

  if (type === "offline") {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `SELECT id, created_at FROM notifications
       WHERE user_id = $1 AND type = 'offline'
         AND read_at IS NULL AND resolved_at IS NULL
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  return null;
}

async function broadcastNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  notification: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: jsonStringify({
      messages: [{
        topic: `user:${userId}`,
        event: "notification_created",
        payload: notification,
        private: true,
      }],
    }),
  });

  if (!res.ok) {
    console.error("Realtime broadcast error:", await res.text());
  }
}

async function createInAppNotification(
  connection: PoolClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  type: "watering" | "offline",
  title: string,
  body: string,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const plantId = type === "watering" ? Number(payload.plantId) : undefined;
  const existing = await findExistingNotification(connection, userId, type, plantId);

  let row: InsertedNotification | undefined;

  if (existing) {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `UPDATE notifications
       SET title = $1, body = $2, payload = $3::jsonb, created_at = now()
       WHERE id = $4
       RETURNING id, created_at`,
      [title, body, jsonStringify(payload), existing.id],
    );
    row = rows[0];
  } else {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `INSERT INTO notifications (user_id, type, title, body, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, created_at`,
      [userId, type, title, body, jsonStringify(payload)],
    );
    row = rows[0];
  }

  if (!row) return null;

  await broadcastNotification(supabaseUrl, serviceRoleKey, userId, {
    id: row.id,
    type,
    title,
    body,
    payload,
    created_at: row.created_at,
  });

  return row.id;
}

// ---------------------------------------------------------------------------
// Notification logic
// ---------------------------------------------------------------------------

async function sendWateringAlerts(
  connection: PoolClient,
  botToken: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ plant: string; humidity: number; telegram: boolean; browser: boolean }[]> {
  const { rows } = await connection.queryObject<WateringRow>(WATERING_QUERY);
  const alerts: { plant: string; humidity: number; telegram: boolean; browser: boolean }[] = [];

  for (const row of rows) {
    const caption = `⚠️ Warning! Plant ${row.plantName} needs water! Humidity reading: ${row.humidity}%`;
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
      const title = `${row.plantName} needs water`;
      const body = `Humidity reading: ${row.humidity}%`;
      const payload = {
        plantId: Number(row.plantId),
        plantName: row.plantName,
        humidity: Number(row.humidity),
        imageUrl: row.imageUrl,
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

    alerts.push({
      plant: row.plantName,
      humidity: Number(row.humidity),
      telegram,
      browser,
    });
  }

  return alerts;
}

async function sendOfflineAlerts(
  connection: PoolClient,
  botToken: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ plant: string; telegram: boolean; browser: boolean }[]> {
  const { rows } = await connection.queryObject<OfflineRow>(OFFLINE_QUERY);
  if (rows.length === 0) return [];

  const byTelegramChat = new Map<string, OfflineRow[]>();
  const byUserId = new Map<string, OfflineRow[]>();

  for (const row of rows) {
    if (row.chatId) {
      const telegramList = byTelegramChat.get(row.chatId) ?? [];
      telegramList.push(row);
      byTelegramChat.set(row.chatId, telegramList);
    }
    if (row.browserEnabled) {
      const browserList = byUserId.get(row.userId) ?? [];
      browserList.push(row);
      byUserId.set(row.userId, browserList);
    }
  }

  const notified: { plant: string; telegram: boolean; browser: boolean }[] = [];

  for (const [chatId, plants] of byTelegramChat) {
    const lines = plants.map((r) => {
      const lastSeen = r.lastSeenAt
        ? `last reading ${new Date(r.lastSeenAt).toLocaleString("en-US", { timeZone: r.notificationTimezone })}`
        : "never seen";
      return `• ${r.plantName} (${lastSeen})`;
    });

    const text =
      `🔴 Warning! The devices for the following plants haven't sent data in too long (possible low battery or malfunction):\n\n` +
      lines.join("\n");

    await sendTelegramMessage(botToken, chatId, text);
    for (const r of plants) {
      notified.push({ plant: r.plantName, telegram: true, browser: false });
    }
  }

  for (const [userId, plants] of byUserId) {
    const lines = plants.map((r) => {
      const lastSeen = r.lastSeenAt
        ? `last reading ${new Date(r.lastSeenAt).toLocaleString("en-US", { timeZone: r.notificationTimezone })}`
        : "never seen";
      return `• ${r.plantName} (${lastSeen})`;
    });

    const title = plants.length === 1
      ? `${plants[0].plantName} is offline`
      : `${plants.length} devices offline`;
    const body =
      `The following plants haven't sent data in too long:\n\n` +
      lines.join("\n");

    const payload = {
      plants: plants.map((r) => ({
        plantId: Number(r.plantId),
        plantName: r.plantName,
        lastSeenAt: r.lastSeenAt,
      })),
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

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const DATABASE_URL = Deno.env.get("SUPABASE_DB_URL");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const CRON_API_KEY = Deno.env.get("CRON_API_KEY");

  if (!SERVICE_ROLE_KEY || !BOT_TOKEN || !DATABASE_URL || !SUPABASE_URL) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500 },
    );
  }

  const apiKey = req.headers.get("apikey");
  if (apiKey !== SERVICE_ROLE_KEY && apiKey !== CRON_API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const pool = new Pool(DATABASE_URL, 3, true);

  try {
    const connection = await pool.connect();
    try {
      const [wateringAlerts, offlineAlerts] = await Promise.all([
        sendWateringAlerts(connection, BOT_TOKEN, SUPABASE_URL, SERVICE_ROLE_KEY),
        sendOfflineAlerts(connection, BOT_TOKEN, SUPABASE_URL, SERVICE_ROLE_KEY),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          wateringAlertsSent: wateringAlerts.length,
          offlineAlertsSent: offlineAlerts.length,
          details: { watering: wateringAlerts, offline: offlineAlerts },
        }),
        { status: 200 },
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500 },
    );
  } finally {
    await pool.end();
  }
});
