export const OPEN_PLANTBOOK_BASE_URL = "https://open.plantbook.io/api/v1";
export const OPEN_PLANTBOOK_SOURCE = "openplantbook";

export function openPlantbookHeaders(apiKey: string): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  // OpenPlantbook API-key auth expects Token auth scheme.
  headers.Authorization = `Token ${apiKey}`;
  headers.apikey = apiKey;
  headers["x-api-key"] = apiKey;

  return headers;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchOpenPlantbookJson(
  url: string,
  timeoutMs: number,
  apiKey: string,
): Promise<unknown> {
  let response = await fetchWithTimeout(url, { method: "GET", headers: openPlantbookHeaders(apiKey) }, timeoutMs);

  if (response.status === 429 || response.status >= 500) {
    response = await fetchWithTimeout(url, { method: "GET", headers: openPlantbookHeaders(apiKey) }, timeoutMs);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenPlantbook request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("OpenPlantbook returned invalid JSON");
  }
}
