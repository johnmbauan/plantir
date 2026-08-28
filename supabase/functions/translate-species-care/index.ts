import { createClient } from "@supabase/supabase-js";
import { jsonResponse, optionsResponse } from "../_shared/http.ts";

// Secrets required:
//   AZURE_TRANSLATOR_API_KEY  — Azure Cognitive Services key
//   AZURE_TRANSLATOR_REGION   — Azure region (e.g. "westeurope")

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AZURE_TRANSLATOR_BASE =
  "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";

const CARE_FIELDS = ["soil", "sunlight", "watering", "fertilization", "pruning"] as const;
type CareField = (typeof CARE_FIELDS)[number];

interface TranslateRequestBody {
  sourceSpeciesId?: string;
  locale?: string;
}

interface AzureTranslation {
  text: string;
  to: string;
}

interface AzureTranslateResponseItem {
  translations: AzureTranslation[];
}

async function translateTexts(
  texts: string[],
  targetLocale: string,
  apiKey: string,
  region: string,
): Promise<string[]> {
  const url = `${AZURE_TRANSLATOR_BASE}&to=${targetLocale}&from=en`;
  const body = texts.map((text) => ({ Text: text }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Azure Translator error ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as AzureTranslateResponseItem[];
  return data.map((item) => item.translations[0]?.text ?? "");
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
  const azureApiKey = Deno.env.get("AZURE_TRANSLATOR_API_KEY");
  const azureRegion = Deno.env.get("AZURE_TRANSLATOR_REGION");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, CORS_ORIGIN_HEADERS, 500);
  }
  if (!azureApiKey || !azureRegion) {
    return jsonResponse({ error: "Azure Translator credentials not configured" }, CORS_ORIGIN_HEADERS, 500);
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

  let body: TranslateRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, CORS_ORIGIN_HEADERS, 400);
  }

  const { sourceSpeciesId, locale } = body;
  if (!sourceSpeciesId?.trim()) {
    return jsonResponse({ error: "sourceSpeciesId is required" }, CORS_ORIGIN_HEADERS, 400);
  }
  if (!locale?.trim()) {
    return jsonResponse({ error: "locale is required" }, CORS_ORIGIN_HEADERS, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 1. Fetch the species row to get its primary key and English care text.
  const { data: species, error: speciesError } = await adminClient
    .from("plant_species")
    .select("id, soil, sunlight, watering, fertilization, pruning")
    .eq("sourceSpeciesId", sourceSpeciesId.trim())  // column name is camelCase in the DB
    .maybeSingle();

  if (speciesError) {
    console.error("translate-species-care: species lookup error:", speciesError.message);
    return jsonResponse({ error: "Failed to look up species" }, CORS_ORIGIN_HEADERS, 500);
  }
  if (!species) {
    return jsonResponse({ error: "Species not found" }, CORS_ORIGIN_HEADERS, 404);
  }

  // 2. Check for a cached translation.
  const { data: cached } = await adminClient
    .from("plant_species_translations")
    .select("soil, sunlight, watering, fertilization, pruning")
    .eq("species_id", species.id)
    .eq("locale", locale)
    .maybeSingle();

  if (cached) {
    return jsonResponse({ translation: cached }, CORS_ORIGIN_HEADERS);
  }

  // 3. Collect the non-null English texts to translate.
  const fieldQueue: { field: CareField; text: string }[] = [];
  for (const field of CARE_FIELDS) {
    const text = species[field] as string | null;
    if (text) fieldQueue.push({ field, text });
  }

  // 4. Call Azure Translator with all care texts in one batched request.
  const translatedValues: Partial<Record<CareField, string>> = {};
  if (fieldQueue.length > 0) {
    try {
      const translated = await translateTexts(
        fieldQueue.map((f) => f.text),
        locale,
        azureApiKey,
        azureRegion,
      );
      for (let i = 0; i < fieldQueue.length; i++) {
        translatedValues[fieldQueue[i].field] = translated[i];
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("translate-species-care: translation error:", msg);
      return jsonResponse({ error: "Translation failed" }, CORS_ORIGIN_HEADERS, 502);
    }
  }

  // 5. Upsert the translated row.
  const upsertRow = {
    species_id: species.id,
    locale,
    soil: translatedValues.soil ?? null,
    sunlight: translatedValues.sunlight ?? null,
    watering: translatedValues.watering ?? null,
    fertilization: translatedValues.fertilization ?? null,
    pruning: translatedValues.pruning ?? null,
    translated_at: new Date().toISOString(),
  };

  const { data: upserted, error: upsertError } = await adminClient
    .from("plant_species_translations")
    .upsert(upsertRow, { onConflict: "species_id,locale" })
    .select("soil, sunlight, watering, fertilization, pruning")
    .single();

  if (upsertError || !upserted) {
    console.error("translate-species-care: upsert error:", upsertError?.message);
    return jsonResponse({ error: "Failed to save translation" }, CORS_ORIGIN_HEADERS, 500);
  }

  return jsonResponse({ translation: upserted }, CORS_ORIGIN_HEADERS);
});
