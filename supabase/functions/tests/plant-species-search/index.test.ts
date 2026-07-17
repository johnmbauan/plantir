/**
 * Integration tests for the plant-species-search edge function.
 *
 * Strategy: intercept Deno.serve before the dynamic import so the handler can
 * be called directly, stub Deno.env.get for env vars, and mock globalThis.fetch
 * per test to simulate Supabase auth + OpenPlantbook responses.
 */

import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
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
// OpenPlantbook fixture data
// ---------------------------------------------------------------------------

const SEARCH_RESULT = {
  pid: "monstera-deliciosa",
  common_name: "Swiss Cheese Plant",
  scientific_name: "Monstera deliciosa",
  image_url: "https://example.com/monstera.jpg",
};

// ---------------------------------------------------------------------------
// Test setup: capture the Deno.serve handler once for the whole suite
// ---------------------------------------------------------------------------

let handler: EdgeHandler;
let restoreEnv: () => void;
const testEnv = { ...TEST_ENV };

beforeAll(async () => {
  restoreEnv = stubEnv(testEnv);
  const intercept = interceptServe();
  await import("../../plant-species-search/index.ts");
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
      new Request("https://edge.fn/plant-species-search", { method: "OPTIONS" }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  });

  it("PUT returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/plant-species-search", { method: "PUT" }),
    );
    assertEquals(res.status, 405);
  });

  it("DELETE returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/plant-species-search", { method: "DELETE" }),
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
      new Request("https://edge.fn/plant-species-search?q=monstera"),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the Supabase auth token is rejected", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authFail() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=monstera", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 401);
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("input validation", () => {
  it("returns 200 with empty results when query is too short (< 3 chars)", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=mo", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.results, []);
  });

  it("returns 200 with empty results for a single-character query", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=m", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 200);
    assertEquals((await res.json()).results, []);
  });

  it("returns 200 with empty results for an empty query", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 200);
    assertEquals((await res.json()).results, []);
  });

  it("returns 400 when query exceeds 80 characters", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const longQuery = "a".repeat(81);
    const res = await handler(
      new Request(`https://edge.fn/plant-species-search?q=${longQuery}`, {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 400);
  });

  it("returns 400 when POST body is invalid JSON", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
        body: "not-json",
      }),
    );
    assertEquals(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Successful searches
// ---------------------------------------------------------------------------

describe("successful search", () => {
  it("GET returns normalised results from OpenPlantbook", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "open.plantbook.io": () => json({ results: [SEARCH_RESULT] }),
      }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=monstera", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.results.length, 1);
    assertEquals(body.results[0].sourceSpeciesId, "monstera-deliciosa");
    assertEquals(body.results[0].displayName, "Swiss Cheese Plant");
    assertEquals(body.results[0].scientificName, "Monstera deliciosa");
    assertEquals(body.results[0].imageUrl, "https://example.com/monstera.jpg");
    assertEquals(body.results[0].source, "openplantbook");
  });

  it("POST with JSON body also returns results", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "open.plantbook.io": () => json({ results: [SEARCH_RESULT] }),
      }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({ q: "monstera", limit: 5 }),
      }),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.results.length, 1);
    assertEquals(body.results[0].sourceSpeciesId, "monstera-deliciosa");
  });

  it("deduplicates results that share the same sourceSpeciesId", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "open.plantbook.io": () =>
          json({
            results: [
              { pid: "monstera-deliciosa", common_name: "Monstera" },
              { pid: "monstera-deliciosa", common_name: "Swiss Cheese Plant" }, // duplicate
            ],
          }),
      }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=monstera", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 200);
    assertEquals((await res.json()).results.length, 1);
  });

  it("respects the CORS Allow-Origin header on successful responses", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "open.plantbook.io": () => json({ results: [SEARCH_RESULT] }),
      }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=monstera", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  it("returns 500 when OPENPLANTBOOK_API_KEY is not set", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const savedKey = testEnv.OPENPLANTBOOK_API_KEY;
    testEnv.OPENPLANTBOOK_API_KEY = undefined;
    try {
      const res = await handler(
        new Request("https://edge.fn/plant-species-search?q=monstera", {
          headers: { Authorization: TEST_AUTH_HEADER },
        }),
      );
      assertEquals(res.status, 500);
      assertStringIncludes(await res.text(), "OpenPlantbook credentials");
    } finally {
      testEnv.OPENPLANTBOOK_API_KEY = savedKey;
    }
  });

  it("returns 502 when OpenPlantbook returns a server error", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        // fetchOpenPlantbookJson retries once on 5xx; always failing triggers the throw.
        "open.plantbook.io": () => new Response("Internal server error", { status: 500 }),
      }),
    );
    const res = await handler(
      new Request("https://edge.fn/plant-species-search?q=monstera", {
        headers: { Authorization: TEST_AUTH_HEADER },
      }),
    );
    assertEquals(res.status, 502);
  });
});
