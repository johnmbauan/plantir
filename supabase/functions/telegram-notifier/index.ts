import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { sendOfflineAlerts, sendWateringAlerts } from "./alerts.ts";

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
