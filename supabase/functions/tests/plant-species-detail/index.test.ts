/**
 * Integration tests for the plant-species-detail edge function.
 *
 * Strategy: intercept Deno.serve, stub Deno.env.get, then mock globalThis.fetch
 * per test to cover Supabase auth + OpenPlantbook detail + plant_species upsert.
 */

import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import {
  authFail,
  authOk,
  interceptServe,
  json,
  routedFetch,
  stubEnv,
  TEST_AUTH_HEADER,
  TEST_ENV,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

/** Minimal OpenPlantbook detail response (fields the function uses). */
const PLANTBOOK_DETAIL = {
  pid: "monstera-deliciosa",
  common_name: "Swiss Cheese Plant",
  scientific_name: "Monstera deliciosa",
  image_url: "https://example.com/monstera.jpg",
  min_soil_moist: 20,
  max_soil_moist: 60,
  min_env_humid: 40,
  max_env_humid: 80,
  min_temp: 16,
  max_temp: 30,
  sunlight: "indirect",
  watering: "moderate",
};

/** The upserted row that the mock Supabase client returns. */
const UPSERTED_SPECIES = {
  id: 1,
  source: "openplantbook",
  sourceSpeciesId: "monstera-deliciosa",
  scientificName: "Monstera deliciosa",
  displayName: "Swiss Cheese Plant",
  commonNames: ["Swiss Cheese Plant"],
  imageUrl: "https://example.com/monstera.jpg",
  minSoilMoisture: 20,
  maxSoilMoisture: 60,
  updatedAt: "2024-01-01T00:00:00Z",
};

/** POST request for a standard successful lookup. */
function speciesDetailRequest(sourceSpeciesId = "monstera-deliciosa"): Request {
  return new Request("https://edge.fn/plant-species-detail", {
    method: "POST",
    headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify({ sourceSpeciesId }),
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let handler: EdgeHandler;
let restoreEnv: () => void;

beforeAll(async () => {
  restoreEnv = stubEnv({ ...TEST_ENV });
  const intercept = interceptServe();
  await import("../../plant-species-detail/index.ts");
  intercept.restore();
  handler = intercept.getHandler();
});

afterAll(() => restoreEnv());

// ---------------------------------------------------------------------------
// Method handling
// ---------------------------------------------------------------------------

describe("method handling", () => {
  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", { method: "OPTIONS" }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  });

  it("GET returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", { method: "GET" }),
    );
    assertEquals(res.status, 405);
  });

  it("PUT returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", { method: "PUT" }),
    );
    assertEquals(res.status, 405);
  });
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

describe("authentication", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", { method: "POST" }),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the Supabase auth token is rejected", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authFail() }),
    );
    const res = await handler(speciesDetailRequest());
    assertEquals(res.status, 401);
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("input validation", () => {
  it("returns 400 when the request body is not valid JSON", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER },
        body: "not-json",
      }),
    );
    assertEquals(res.status, 400);
  });

  it("returns 400 when sourceSpeciesId is missing from the body", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error, "sourceSpeciesId is required");
  });

  it("returns 400 when sourceSpeciesId is an empty string", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-detail", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({ sourceSpeciesId: "   " }),
      }),
    );
    assertEquals(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("successful detail fetch", () => {
  it("fetches from OpenPlantbook, upserts into plant_species, and returns the row", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        // OpenPlantbook detail endpoint
        "open.plantbook.io": () => json(PLANTBOOK_DETAIL),
        // Supabase plant_species upsert with .single() — expects a single object
        "/rest/v1/plant_species": () => json(UPSERTED_SPECIES),
      }),
    );
    const res = await handler(speciesDetailRequest());
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.species.sourceSpeciesId, "monstera-deliciosa");
    assertEquals(body.species.displayName, "Swiss Cheese Plant");
    assertEquals(body.species.minSoilMoisture, 20);
  });

  it("includes the CORS Allow-Origin header", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "open.plantbook.io": () => json(PLANTBOOK_DETAIL),
        "/rest/v1/plant_species": () => json(UPSERTED_SPECIES),
      }),
    );
    const res = await handler(speciesDetailRequest());
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  it("returns 502 when OpenPlantbook returns a server error", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        // fetchOpenPlantbookJson retries once on 5xx; both attempts fail → throws
        "open.plantbook.io": () => new Response("Internal error", { status: 500 }),
      }),
    );
    const res = await handler(speciesDetailRequest());
    assertEquals(res.status, 502);
  });

  it("returns 502 when the Supabase upsert fails", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "open.plantbook.io": () => json(PLANTBOOK_DETAIL),
        // Supabase upsert returns an error
        "/rest/v1/plant_species": () =>
          new Response(
            JSON.stringify({ code: "23505", message: "Conflict" }),
            { status: 409, headers: { "Content-Type": "application/json" } },
          ),
      }),
    );
    const res = await handler(speciesDetailRequest());
    assertEquals(res.status, 502);
  });
});
