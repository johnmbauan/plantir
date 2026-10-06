import { createClient } from "@supabase/supabase-js";
import { configureExpeditionBroadcast } from "./notifications.ts";
import {
  bootstrapSanctuary,
  cancelExpedition,
  completeDue,
  depart,
  markIntro,
  welcomeExpedition,
} from "./sanctuary.ts";
import type { DurationKey } from "./catalog.ts";

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action =
  | "bootstrap"
  | "depart"
  | "complete_due"
  | "cancel"
  | "welcome"
  | "grant_care"
  | "mark_intro";

interface RequestBody {
  action?: Action;
  destinationId?: string;
  durationKey?: DurationKey;
  team?: string[];
  expeditionId?: string;
  introCompleted?: boolean;
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

  const action: Action = body.action ?? "bootstrap";
  const admin = createClient(supabaseUrl, serviceRoleKey);
  configureExpeditionBroadcast(supabaseUrl, serviceRoleKey);

  try {
    if (action === "complete_due") {
      const apiKey = req.headers.get("apikey");
      if (apiKey !== serviceRoleKey && apiKey !== cronApiKey) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      const result = await completeDue(admin);
      return jsonResponse({ success: true, ...result });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    if (action === "bootstrap") {
      await bootstrapSanctuary(admin, user.id);
      return jsonResponse({ success: true });
    }

    if (action === "grant_care") {
      await bootstrapSanctuary(admin, user.id);
      return jsonResponse({ success: true });
    }

    if (action === "depart") {
      if (!body.destinationId || !body.durationKey || !body.team) {
        return jsonResponse({ error: "destinationId, durationKey, and team are required" }, 400);
      }
      const result = await depart(admin, user.id, body.destinationId, body.durationKey, body.team);
      return jsonResponse(result);
    }

    if (action === "cancel") {
      if (!body.expeditionId) return jsonResponse({ error: "expeditionId required" }, 400);
      await cancelExpedition(admin, user.id, body.expeditionId);
      return jsonResponse({ success: true });
    }

    if (action === "welcome") {
      if (!body.expeditionId) return jsonResponse({ error: "expeditionId required" }, 400);
      const outcome = await welcomeExpedition(admin, user.id, body.expeditionId);
      return jsonResponse(outcome);
    }

    if (action === "mark_intro") {
      await markIntro(admin, user.id, body.introCompleted !== false);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("garden-expeditions error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
