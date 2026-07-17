// Garden achievements: evaluate unlocks, record client events / dashboard visits,
// and run the daily healthy-streak snapshot (cron).

import { createClient } from "@supabase/supabase-js";
import {
  configureAchievementBroadcast,
  evaluateUserAchievements,
  trackClientEventAndEvaluate,
  trackDashboardVisitAndEvaluate,
  runDailyHealthyStreakSnapshot,
} from "./gardenAchievements.ts";

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action =
  | "evaluate"
  | "record_client_event"
  | "dashboard_visit"
  | "snapshot_streaks";

interface RequestBody {
  action?: Action;
  eventKey?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_ORIGIN_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const requestedHeaders = req.headers.get("Access-Control-Request-Headers") ?? "";
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_ORIGIN_HEADERS,
        "Access-Control-Allow-Headers": requestedHeaders,
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronApiKey = Deno.env.get("CRON_API_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
  }

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action: Action = body.action ?? "evaluate";
  const admin = createClient(supabaseUrl, serviceRoleKey);
  configureAchievementBroadcast(supabaseUrl, serviceRoleKey);

  try {
    if (action === "snapshot_streaks") {
      const apiKey = req.headers.get("apikey");
      if (apiKey !== serviceRoleKey && apiKey !== cronApiKey) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      const result = await runDailyHealthyStreakSnapshot(admin);
      return jsonResponse({ success: true, ...result });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (action === "evaluate") {
      const newly = await evaluateUserAchievements(admin, user.id);
      return jsonResponse(newly);
    }

    if (action === "record_client_event") {
      if (!body.eventKey) {
        return jsonResponse({ error: "eventKey required" }, 400);
      }
      const newly = await trackClientEventAndEvaluate(admin, user.id, body.eventKey);
      return jsonResponse(newly);
    }

    if (action === "dashboard_visit") {
      const newly = await trackDashboardVisitAndEvaluate(admin, user.id);
      return jsonResponse(newly);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("garden-achievements error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
