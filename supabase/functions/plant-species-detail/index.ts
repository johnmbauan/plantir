import { createClient } from "@supabase/supabase-js";
import { jsonResponse, optionsResponse } from "../_shared/http.ts";
import {
  fetchOpenPlantbookJson,
  OPEN_PLANTBOOK_BASE_URL,
  OPEN_PLANTBOOK_SOURCE,
} from "../_shared/openPlantbook.ts";
import { asString, asStringArray, objectFromUnknown } from "../_shared/normalize.ts";

// Edge function responsibilities:
// 1) Validate/authenticate the caller.
// 2) Fetch one species detail payload from OpenPlantbook.
// 3) Normalize provider fields to our internal plant_species shape.
// 4) Upsert into plant_species cache and return the saved row.

const REQUEST_TIMEOUT_MS = 10000;

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DetailRequestBody {
  sourceSpeciesId?: string;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function boundedPercent(value: number | null): number | null {
  if (value == null) return null;
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > 100) return null;
  return rounded;
}

function boundedTemperature(value: number | null): number | null {
  if (value == null) return null;
  const rounded = Math.round(value);
  if (rounded < -80 || rounded > 100) return null;
  return rounded;
}

function extractDetailPayload(payload: unknown): Record<string, unknown> | null {
  const root = objectFromUnknown(payload);
  if (!root) return null;

  const candidate = objectFromUnknown(root.result)
    ?? objectFromUnknown(root.data)
    ?? objectFromUnknown(root.plant);

  return candidate ?? root;
}

async function fetchOpenPlantbookDetail(
  sourceSpeciesId: string,
  openPlantbookApiKey: string,
): Promise<Record<string, unknown>> {
  // We request care info in the same round-trip so the app can show guidance immediately.
  const url =
    `${OPEN_PLANTBOOK_BASE_URL}/plant/detail/${encodeURIComponent(sourceSpeciesId)}?include=care`;
  const parsed = await fetchOpenPlantbookJson(url, REQUEST_TIMEOUT_MS, openPlantbookApiKey);

  const detail = extractDetailPayload(parsed);
  if (!detail) {
    throw new Error("OpenPlantbook detail payload is empty");
  }
  return detail;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse(req, CORS_ORIGIN_HEADERS);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, CORS_ORIGIN_HEADERS, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, CORS_ORIGIN_HEADERS, 500);
  }

  const openPlantbookApiKey = Deno.env.get("OPENPLANTBOOK_API_KEY");
  if (!openPlantbookApiKey) {
    return jsonResponse({ error: "OpenPlantbook credentials not configured" }, CORS_ORIGIN_HEADERS, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, CORS_ORIGIN_HEADERS, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, CORS_ORIGIN_HEADERS, 401);
  }

  let body: DetailRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, CORS_ORIGIN_HEADERS, 400);
  }

  const sourceSpeciesId = body.sourceSpeciesId?.trim();
  if (!sourceSpeciesId) {
    return jsonResponse({ error: "sourceSpeciesId is required" }, CORS_ORIGIN_HEADERS, 400);
  }

  try {
    const detail = await fetchOpenPlantbookDetail(sourceSpeciesId, openPlantbookApiKey);

    // OpenPlantbook field names vary across responses; normalize defensively.
    const scientificName = asString(detail.scientific_name)
      ?? asString(detail.scientificName)
      ?? asString(detail.species)
      ?? asString(detail.pid);
    const displayName = asString(detail.common_name)
      ?? asString(detail.display_name)
      ?? asString(detail.displayName)
      ?? scientificName
      ?? sourceSpeciesId;
    const commonNames = asStringArray(detail.aliases);
    if (displayName && !commonNames.includes(displayName)) commonNames.unshift(displayName);

    const normalized = {
      source: OPEN_PLANTBOOK_SOURCE,
      sourceSpeciesId,
      scientificName,
      displayName,
      commonNames,
      imageUrl: asString(detail.image_url) ?? asString(detail.imageUrl),
      minSoilMoisture: boundedPercent(
        asNumber(detail.min_soil_moist)
          ?? asNumber(detail.min_soil_moisture)
          ?? asNumber(detail.minSoilMoisture),
      ),
      maxSoilMoisture: boundedPercent(
        asNumber(detail.max_soil_moist)
          ?? asNumber(detail.max_soil_moisture)
          ?? asNumber(detail.maxSoilMoisture),
      ),
      minEnvHumidity: boundedPercent(
        asNumber(detail.min_env_humid)
          ?? asNumber(detail.min_env_humidity)
          ?? asNumber(detail.minEnvHumidity),
      ),
      maxEnvHumidity: boundedPercent(
        asNumber(detail.max_env_humid)
          ?? asNumber(detail.max_env_humidity)
          ?? asNumber(detail.maxEnvHumidity),
      ),
      minTemperatureCelsius: boundedTemperature(
        asNumber(detail.min_temp)
          ?? asNumber(detail.min_temp_celsius)
          ?? asNumber(detail.minTemperatureCelsius),
      ),
      maxTemperatureCelsius: boundedTemperature(
        asNumber(detail.max_temp)
          ?? asNumber(detail.max_temp_celsius)
          ?? asNumber(detail.maxTemperatureCelsius),
      ),
      sunlight: asString(detail.sunlight),
      soil: asString(detail.soil),
      watering: asString(detail.watering),
      fertilization: asString(detail.fertilization),
      pruning: asString(detail.pruning),
      rawPayload: detail,
      sourceUpdatedAt: asString(detail.updated_at) ?? asString(detail.updatedAt),
      updatedAt: new Date().toISOString(),
    };

    // Cache by provider+provider-id so repeated requests refresh instead of duplicating rows.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: upserted, error: upsertError } = await adminClient
      .from("plant_species")
      .upsert(normalized, {
        onConflict: "source,sourceSpeciesId",
        ignoreDuplicates: false,
      })
      .select("*")
      .single();

    if (upsertError || !upserted) {
      throw new Error(upsertError?.message ?? "Failed to cache species");
    }

    return jsonResponse({ species: upserted }, CORS_ORIGIN_HEADERS);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("plant-species-detail:", message);
    return jsonResponse({ error: "Failed to fetch species details" }, CORS_ORIGIN_HEADERS, 502);
  }
});
