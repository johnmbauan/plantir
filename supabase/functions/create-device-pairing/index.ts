// Edge function called by the web app to initiate a device pairing flow.
// It generates a one-time pairing token and bundles it with the project URL
// and anon key into a single string that the user can transfer to their
// device (e.g. via QR code or manual entry). The device then calls
// register-device with that bundle to complete the pairing.

import { createClient } from "@supabase/supabase-js";

const PAIRING_TTL_MINUTES = 30;
const BUNDLE_DELIMITER = "###";

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreatePairingRequest {
  plantId?: number | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_ORIGIN_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    // Reflect whatever headers the browser intends to send rather than
    // maintaining a fixed allow-list that can get out of sync with the client.
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

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
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

  let body: CreatePairingRequest = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const plantId = body.plantId ?? null;
  if (plantId != null) {
    const { data: plant, error: plantError } = await userClient
      .from("plants")
      .select("id")
      .eq("id", plantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (plantError) {
      return jsonResponse({ error: plantError.message }, 500);
    }
    if (!plant) {
      return jsonResponse({ error: "Plant not found" }, 404);
    }
  }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MINUTES * 60 * 1000).toISOString();

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: row, error: insertError } = await adminClient
    .from("device_pairing_tokens")
    .insert({
      token,
      user_id: user.id,
      plant_id: plantId,
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();

  if (insertError || !row) {
    return jsonResponse({ error: insertError?.message ?? "Failed to create pairing token" }, 500);
  }

  const bundle = `${supabaseUrl}${BUNDLE_DELIMITER}${anonKey}${BUNDLE_DELIMITER}${token}`;

  return jsonResponse({
    tokenId: row.id,
    bundle,
    expiresAt: row.expires_at,
  });
});
