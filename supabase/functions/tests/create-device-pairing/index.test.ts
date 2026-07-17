/**
 * Integration tests for the create-device-pairing edge function.
 *
 * Strategy: intercept Deno.serve, stub Deno.env.get, then mock globalThis.fetch
 * per test to cover Supabase auth, plant ownership check, and token insert.
 */

import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import {
  authFail,
  authOk,
  interceptServe,
  json,
  routedFetch,
  stubEnv,
  TEST_ANON_KEY,
  TEST_AUTH_HEADER,
  TEST_ENV,
  TEST_SUPABASE_URL,
  TEST_USER_ID,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/** Inserted pairing token row returned by the mock Supabase client. */
const TOKEN_ROW = {
  id: "token-row-uuid",
  expires_at: "2025-12-31T23:59:59Z",
};

/**
 * POST request for a basic pairing (no plantId).
 * The body must be valid JSON; the handler will parse it after auth.
 */
function pairingRequest(body: Record<string, unknown> = {}): Request {
  return new Request("https://edge.fn/create-device-pairing", {
    method: "POST",
    headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Fetch mock for the happy path without a plantId (skips plant lookup). */
function happyPathFetch() {
  return routedFetch({
    "/auth/v1/user": () => authOk(),
    // device_pairing_tokens insert with .single() — expects a single object
    "/rest/v1/device_pairing_tokens": () => json(TOKEN_ROW, 201),
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
  await import("../../create-device-pairing/index.ts");
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
      new Request("https://edge.fn/create-device-pairing", { method: "OPTIONS" }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  });

  it("GET returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/create-device-pairing", { method: "GET" }),
    );
    assertEquals(res.status, 405);
  });

  it("PUT returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/create-device-pairing", { method: "PUT" }),
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
      new Request("https://edge.fn/create-device-pairing", { method: "POST" }),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the Supabase auth token is rejected", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authFail() }),
    );
    const res = await handler(pairingRequest());
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
      new Request("https://edge.fn/create-device-pairing", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER },
        body: "not-json",
      }),
    );
    assertEquals(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Pairing without a plantId
// ---------------------------------------------------------------------------

describe("pairing without a plantId", () => {
  it("returns 200 with a bundle string and expiry timestamp", async () => {
    using _fetch = stub(globalThis, "fetch", happyPathFetch());
    const res = await handler(pairingRequest());
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.tokenId, TOKEN_ROW.id);
    assertEquals(body.expiresAt, TOKEN_ROW.expires_at);
    // Bundle format: supabaseUrl###anonKey###<64-char token>
    assert(typeof body.bundle === "string");
    assertStringIncludes(body.bundle, TEST_SUPABASE_URL);
    assertStringIncludes(body.bundle, TEST_ANON_KEY);
  });

  it("bundle contains three segments delimited by ###", async () => {
    using _fetch = stub(globalThis, "fetch", happyPathFetch());
    const res = await handler(pairingRequest());
    const { bundle } = await res.json();
    const parts = bundle.split("###");
    assertEquals(parts.length, 3);
    assertEquals(parts[0], TEST_SUPABASE_URL);
    assertEquals(parts[1], TEST_ANON_KEY);
    // Token is two UUIDs stripped of hyphens (64 hex chars).
    assertEquals(parts[2].length, 64);
    assert(/^[0-9a-f]+$/i.test(parts[2]));
  });

  it("null plantId is treated the same as omitting plantId", async () => {
    using _fetch = stub(globalThis, "fetch", happyPathFetch());
    const res = await handler(pairingRequest({ plantId: null }));
    assertEquals(res.status, 200);
  });
});

// ---------------------------------------------------------------------------
// Pairing with a plantId
// ---------------------------------------------------------------------------

describe("pairing with a plantId", () => {
  it("returns 200 when the plant belongs to the authenticated user", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        // plants maybeSingle: plant found, belongs to user
        "/rest/v1/plants": () => json({ id: 42, user_id: TEST_USER_ID }),
        "/rest/v1/device_pairing_tokens": () => json(TOKEN_ROW, 201),
      }),
    );
    const res = await handler(pairingRequest({ plantId: 42 }));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertStringIncludes(body.bundle, TEST_SUPABASE_URL);
  });

  it("returns 404 when the plant is not found or does not belong to the user", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        // plants maybeSingle: no row — returns JSON null (PostgREST Prefer: missing=null)
        "/rest/v1/plants": () => json(null),
      }),
    );
    const res = await handler(pairingRequest({ plantId: 99 }));
    assertEquals(res.status, 404);
    assertEquals((await res.json()).error, "Plant not found");
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  it("returns 500 when the device_pairing_tokens insert fails", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "/rest/v1/device_pairing_tokens": () =>
          new Response(
            JSON.stringify({ message: "duplicate key", code: "23505" }),
            { status: 409, headers: { "Content-Type": "application/json" } },
          ),
      }),
    );
    const res = await handler(pairingRequest());
    assertEquals(res.status, 500);
  });
});
