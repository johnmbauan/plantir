import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

Deno.serve(async (req) => {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
  // This secret is used to verify that the request is coming from an authorized source (e.g., your backend or a trusted service)
  // SUPABASE_SERVICE_ROLE_KEY is a default environment variable always provided by Supabase that contains the service role key, which has elevated permissions.
  // you can't edit this variable from the Dashboard or the CLI. 
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  // This is the connection string for your Supabase database, which includes the username, password, host, port, and database name. It's used to establish a connection to the database and execute queries.
  // SUPABASE_DB_URL is a default environment variable always provided by Supabase that contains the database connection URL, which is used to connect to your Supabase database.
  // you can't edit this variable from the Dashboard or the CLI.
  const DATABASE_URL = Deno.env.get("SUPABASE_DB_URL");

  // This is an hardcoded API key used for authenticating requests from the cron job that triggers this function.
  const CRON_API_KEY = Deno.env.get("CRON_API_KEY");
  /**
   * SQL query for retrieving the latest humidity measurement for each device in the last 24 hours
   * where the moisture level is below the configured minimum threshold.
   *
   * Selects:
   * - plant name
   * - plant image URL
   * - latest humidity percentage
   *
   * Uses:
   * - humidity_measurements (latest per device within 24h)
   * - devices
   * - plants
   * - humidity_sensors_config (min humidity threshold filter)
   */
  const QUERY = `
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

  if (!SERVICE_ROLE_KEY || !BOT_TOKEN || !CHAT_ID || !DATABASE_URL) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500 }
    );
  }

  const isAuthorized = req.headers.get("apikey") === SERVICE_ROLE_KEY || req.headers.get("apikey") === CRON_API_KEY;
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const pool = new Pool(DATABASE_URL, 3, true);

  try {
    const connection = await pool.connect();

    try {
      const result = await connection.queryObject<{
        plantName: string;
        imageUrl: string | null;
        humidity: number;
      }>(QUERY);

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "No plants need watering",
          }),
          { status: 200 }
        );
      }

      const alerts: { plant: string; humidity: number; success: boolean }[] = [];

      for (const row of result.rows) {
        const caption = `⚠️ Attenzione! La pianta ${row.plantName} ha bisogno di acqua! Umidità rilevata del ${row.humidity}%`;

        const endpoint = row.imageUrl ? "sendPhoto" : "sendMessage";
        const body = row.imageUrl
          ? { chat_id: CHAT_ID, photo: row.imageUrl, caption }
          : { chat_id: CHAT_ID, text: caption };

        const tgResponse = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        const tgResult = await tgResponse.json();

        if (!tgResult.ok) {
          console.error(
            `Telegram error for ${row.plantName}:`,
            tgResult.description
          );
        }

        alerts.push({
          plant: row.plantName,
          humidity: Number(row.humidity),
          success: tgResult.ok,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          alertsSent: alerts.length,
          details: alerts,
        }),
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error catch:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
});
