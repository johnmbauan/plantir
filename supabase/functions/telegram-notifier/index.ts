import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import type { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WateringRow {
  plantName: string;
  imageUrl: string | null;
  humidity: number;
}

interface OfflineRow {
  plantName: string;
  lastSeenAt: string | null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const WATERING_QUERY = `
  SELECT
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
  WHERE hm."humidityPercentage" <= hsc."minHumidityThreshold"
`;

const OFFLINE_QUERY = `
  SELECT
    p.name AS "plantName",
    MAX(hm."createdAt") AS "lastSeenAt"
  FROM devices d
  JOIN plants p ON p.id = d."plantId"
  JOIN humidity_sensors_config hsc ON hsc."deviceId" = d.id
  LEFT JOIN humidity_measurements hm ON hm."deviceId" = d.id
  GROUP BY d.id, p.name, hsc."sleepDurationSeconds"
  HAVING
    MAX(hm."createdAt") IS NULL
    OR MAX(hm."createdAt") < NOW() - (hsc."sleepDurationSeconds" * 2 * INTERVAL '1 second')
`;

// ---------------------------------------------------------------------------
// Telegram helpers
// ---------------------------------------------------------------------------

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
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
  caption: string
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
// Notification logic
// ---------------------------------------------------------------------------

async function sendWateringAlerts(
  connection: PoolClient,
  botToken: string,
  chatId: string
): Promise<{ plant: string; humidity: number; success: boolean }[]> {
  const { rows } = await connection.queryObject<WateringRow>(WATERING_QUERY);
  const alerts: { plant: string; humidity: number; success: boolean }[] = [];

  for (const row of rows) {
    const caption = `⚠️ Attenzione! La pianta ${row.plantName} ha bisogno di acqua! Umidità rilevata del ${row.humidity}%`;
    try {
      if (row.imageUrl) {
        await sendTelegramPhoto(botToken, chatId, row.imageUrl, caption);
      } else {
        await sendTelegramMessage(botToken, chatId, caption);
      }
      alerts.push({ plant: row.plantName, humidity: Number(row.humidity), success: true });
    } catch {
      alerts.push({ plant: row.plantName, humidity: Number(row.humidity), success: false });
    }
  }

  return alerts;
}

async function sendOfflineAlert(
  connection: PoolClient,
  botToken: string,
  chatId: string
): Promise<string[]> {
  const { rows } = await connection.queryObject<OfflineRow>(OFFLINE_QUERY);
  if (rows.length === 0) return [];

  const lines = rows.map((r: OfflineRow) => {
    const lastSeen = r.lastSeenAt
      ? `ultima lettura ${new Date(r.lastSeenAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`
      : "mai visto";
    return `• ${r.plantName} (${lastSeen})`;
  });

  const text =
    `🔴 Attenzione! I dispositivi delle seguenti piante non inviano dati da troppo tempo (possibile batteria scarica o malfunzionamento):\n\n` +
    lines.join("\n");

  await sendTelegramMessage(botToken, chatId, text);

  return rows.map((r: OfflineRow) => r.plantName);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
  // SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL are default env vars always provided by Supabase.
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const DATABASE_URL = Deno.env.get("SUPABASE_DB_URL");
  const CRON_API_KEY = Deno.env.get("CRON_API_KEY");

  if (!SERVICE_ROLE_KEY || !BOT_TOKEN || !CHAT_ID || !DATABASE_URL) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500 }
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
      const [alerts, offlineDevices] = await Promise.all([
        sendWateringAlerts(connection, BOT_TOKEN, CHAT_ID),
        sendOfflineAlert(connection, BOT_TOKEN, CHAT_ID),
      ]);

      return new Response(
        JSON.stringify({ success: true, alertsSent: alerts.length, details: alerts, offlineDevices }),
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
});
