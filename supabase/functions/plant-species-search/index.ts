import { createClient } from "@supabase/supabase-js";
import { jsonResponse, optionsResponse } from "../_shared/http.ts";
import {
  fetchOpenPlantbookJson,
  OPEN_PLANTBOOK_BASE_URL,
  OPEN_PLANTBOOK_SOURCE,
} from "../_shared/openPlantbook.ts";
import { asString, objectFromUnknown } from "../_shared/normalize.ts";

// Edge function responsibilities:
// 1) Validate/authenticate the caller.
// 2) Proxy user query to OpenPlantbook search.
// 3) Normalize provider records to a compact search DTO for UI suggestions.
// 4) Deduplicate and limit results before returning to the client.

const REQUEST_TIMEOUT_MS = 8000;
const MAX_QUERY_LENGTH = 80;
const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 20;

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SpeciesSearchResult {
  source: string;
  sourceSpeciesId: string;
  scientificName: string | null;
  displayName: string | null;
  imageUrl: string | null;
}

function extractItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => objectFromUnknown(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null);
  }

  const root = objectFromUnknown(payload);
  if (!root) return [];

  const candidateArrays = [
    root.results,
    root.plants,
    root.data,
    root.items,
  ];

  for (const candidate of candidateArrays) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map((entry) => objectFromUnknown(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null);
  }

  return [];
}

function mapSearchItem(item: Record<string, unknown>): SpeciesSearchResult | null {
  const sourceSpeciesId = asString(item.pid)
    ?? asString(item.species)
    ?? asString(item.scientific_name)
    ?? asString(item.scientificName);

  if (!sourceSpeciesId) return null;

  const commonName = asString(item.common_name)
    ?? asString(item.commonName)
    ?? asString(item.display_name)
    ?? asString(item.displayName);

  const scientificName = asString(item.scientific_name)
    ?? asString(item.scientificName)
    ?? asString(item.species)
    ?? asString(item.pid);

  const imageUrl = asString(item.image_url)
    ?? asString(item.imageUrl)
    ?? null;

  const displayName = commonName ?? scientificName ?? sourceSpeciesId;

  return {
    source: OPEN_PLANTBOOK_SOURCE,
    sourceSpeciesId,
    scientificName,
    displayName,
    imageUrl,
  };
}

async function fetchOpenPlantbookSearch(search: string, openPlantbookApiKey: string): Promise<unknown> {
  // OpenPlantbook search endpoint expects the "alias" query parameter.
  const url = `${OPEN_PLANTBOOK_BASE_URL}/plant/search?alias=${encodeURIComponent(search)}`;
  return fetchOpenPlantbookJson(url, REQUEST_TIMEOUT_MS, openPlantbookApiKey);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse(req, CORS_ORIGIN_HEADERS);
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, CORS_ORIGIN_HEADERS, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, CORS_ORIGIN_HEADERS, 500);
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

  const url = new URL(req.url);
  let rawSearch = "";
  let rawLimit: string | number | null = null;

  if (req.method === "GET") {
    rawSearch = (url.searchParams.get("q") ?? "").trim();
    rawLimit = url.searchParams.get("limit");
  } else {
    try {
      const body = await req.json() as { q?: string; limit?: number | string };
      rawSearch = typeof body.q === "string" ? body.q.trim() : "";
      rawLimit = body.limit ?? null;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, CORS_ORIGIN_HEADERS, 400);
    }
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(rawLimit ?? "8") || 8));

  if (rawSearch.length < MIN_QUERY_LENGTH) {
    return jsonResponse({ results: [] }, CORS_ORIGIN_HEADERS);
  }

  if (rawSearch.length > MAX_QUERY_LENGTH) {
    return jsonResponse(
      { error: `Query too long. Maximum ${MAX_QUERY_LENGTH} characters.` },
      CORS_ORIGIN_HEADERS,
      400,
    );
  }

  const openPlantbookApiKey = Deno.env.get("OPENPLANTBOOK_API_KEY");
  if (!openPlantbookApiKey) {
    return jsonResponse({ error: "OpenPlantbook credentials not configured" }, CORS_ORIGIN_HEADERS, 500);
  }

  try {
    const payload = await fetchOpenPlantbookSearch(rawSearch, openPlantbookApiKey);
    // Normalize multiple possible provider payload layouts into one result model.
    const normalized = extractItems(payload)
      .map(mapSearchItem)
      .filter((entry): entry is SpeciesSearchResult => entry !== null);

    // Deduping by sourceSpeciesId avoids repeated aliases mapping to the same species.
    const deduped = Array.from(
      new Map(normalized.map((entry) => [entry.sourceSpeciesId, entry])).values(),
    ).slice(0, limit);

    return jsonResponse({ results: deduped }, CORS_ORIGIN_HEADERS);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("plant-species-search:", message);
    return jsonResponse({ error: "Failed to search plant species" }, CORS_ORIGIN_HEADERS, 502);
  }
});
