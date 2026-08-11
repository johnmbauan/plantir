// Lightweight cron target: hit PostgREST so its DB pool stays warm.
import { createClient } from "@supabase/supabase-js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronApiKey = Deno.env.get("CRON_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
  }

  const apiKey = req.headers.get("apikey");
  if (apiKey !== serviceRoleKey && apiKey !== cronApiKey) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.from("devices").select("id").limit(1);

  if (error) {
    console.error("db-keepalive PostgREST ping failed:", error.message);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }

  return jsonResponse({ ok: true });
});
