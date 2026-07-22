/**
 * Integration tests for the garden-achievements edge function (index.ts entry point).
 *
 * Strategy: intercept Deno.serve, stub Deno.env.get, then mock globalThis.fetch
 * per test to simulate Supabase auth and all REST table interactions.
 *
 * Note: this file covers the HTTP routing and action dispatch layer.
 * The badge evaluation logic itself is covered by the badgeEligibility unit tests.
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
  TEST_SERVICE_ROLE_KEY,
  TEST_USER_ID,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

/** Minimal user_garden_progress row that satisfies all callers in this suite. */
const PROGRESS_ROW = {
  user_id: TEST_USER_ID,
  last_dashboard_visit: null,
  last_all_healthy_date: null,
  healthy_streak_days: 0,
  client_events: {},
};

/**
 * Fetch mock for the "evaluate with empty DB" scenario.
 *
 * Route ordering matters: more-specific patterns must come before the
 * "/rest/v1/" catch-all so they win on first-match.
 *
 * Mock logic for key tables:
 *   user_garden_progress GET  → existing PROGRESS_ROW (skips the insert path)
 *   user_garden_progress PATCH → null (update acknowledged)
 *   notification_settings      → null (maybeSingle, no settings row)
 *   profiles                   → null (maybeSingle, no profile row)
 *   /rest/v1/ (catch-all)      → [] (empty array for all other tables)
 */
function emptyDbFetch() {
  return routedFetch({
    "/auth/v1/user": () => authOk(),
    "user_garden_progress": (req) =>
      req.method === "PATCH" ? json(null) : json(PROGRESS_ROW),
    "notification_settings": () => json(null),
    "profiles": () => json(null),
    "/rest/v1/": () => json([]),
  });
}

// ---------------------------------------------------------------------------
// POST request helpers
// ---------------------------------------------------------------------------

function postRequest(body: Record<string, unknown> = { action: "evaluate" }): Request {
  return new Request("https://edge.fn/garden-achievements", {
    method: "POST",
    headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function cronRequest(apiKey: string, body: Record<string, unknown>): Request {
  return new Request("https://edge.fn/garden-achievements", {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Test setup: capture the Deno.serve handler once for the whole suite
// ---------------------------------------------------------------------------

let handler: EdgeHandler;
let restoreEnv: () => void;

beforeAll(async () => {
  restoreEnv = stubEnv({ ...TEST_ENV });
  const intercept = interceptServe();
  await import("../../garden-achievements/index.ts");
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
      new Request("https://edge.fn/garden-achievements", { method: "OPTIONS" }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  });

  it("GET returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/garden-achievements", { method: "GET" }),
    );
    assertEquals(res.status, 405);
  });

  it("PATCH returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/garden-achievements", { method: "PATCH" }),
    );
    assertEquals(res.status, 405);
  });
});

// ---------------------------------------------------------------------------
// Authentication — evaluate / record_client_event / dashboard_visit
// ---------------------------------------------------------------------------

describe("authentication (user actions)", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await handler(
      new Request("https://edge.fn/garden-achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate" }),
      }),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the Supabase auth token is rejected", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authFail() }),
    );
    const res = await handler(postRequest({ action: "evaluate" }));
    assertEquals(res.status, 401);
  });
});

// ---------------------------------------------------------------------------
// snapshot_streaks — cron API-key auth
// ---------------------------------------------------------------------------

describe("snapshot_streaks action", () => {
  it("returns 401 when the apikey header is absent", async () => {
    // No Authorization and no apikey → falls into snapshot_streaks → 401
    const res = await handler(
      new Request("https://edge.fn/garden-achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snapshot_streaks" }),
      }),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the apikey header value is wrong", async () => {
    const res = await handler(cronRequest("wrong-api-key", { action: "snapshot_streaks" }));
    assertEquals(res.status, 401);
  });

  it("returns 200 with zero users when there are no plants in the DB", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        // snapshot_streaks first queries plants to find user IDs
        "/rest/v1/": () => json([]),
      }),
    );
    const res = await handler(
      cronRequest(TEST_SERVICE_ROLE_KEY, { action: "snapshot_streaks" }),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
    assertEquals(body.users, 0);
  });
});

// ---------------------------------------------------------------------------
// evaluate action
// ---------------------------------------------------------------------------

describe("evaluate action", () => {
  it("returns 200 with an empty array when no badges are eligible", async () => {
    using _fetch = stub(globalThis, "fetch", emptyDbFetch());
    const res = await handler(postRequest({ action: "evaluate" }));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body, []);
  });

  it("defaults to action=evaluate when action is omitted from the body", async () => {
    using _fetch = stub(globalThis, "fetch", emptyDbFetch());
    // Body without action → defaults to "evaluate"
    const res = await handler(postRequest({}));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), []);
  });

  it("returns 200 even when the body is unparseable (defaults to evaluate)", async () => {
    using _fetch = stub(globalThis, "fetch", emptyDbFetch());
    // The handler wraps JSON parse in try/catch and falls back to {}
    const res = await handler(
      new Request("https://edge.fn/garden-achievements", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER },
        body: "not-json",
      }),
    );
    assertEquals(res.status, 200);
  });
});

// ---------------------------------------------------------------------------
// record_client_event action
// ---------------------------------------------------------------------------

describe("record_client_event action", () => {
  it("returns 400 when eventKey is missing", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(postRequest({ action: "record_client_event" }));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "eventKey required");
  });

  it("returns 500 when eventKey is not in the server whitelist", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      // writeClientEvent throws before any DB call when the key is disallowed
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      postRequest({ action: "record_client_event", eventKey: "disallowed_key" }),
    );
    assertEquals(res.status, 500);
  });

  it("returns 200 with eligible achievements for a whitelisted event key", async () => {
    using _fetch = stub(globalThis, "fetch", emptyDbFetch());
    // "weather_city_set" is in ALLOWED_CLIENT_EVENTS
    const res = await handler(
      postRequest({ action: "record_client_event", eventKey: "weather_city_set" }),
    );
    assertEquals(res.status, 200);
    // No badges in the empty DB → newly unlocked list is []
    assertEquals(await res.json(), []);
  });

  it("accepts notification_settings_saved as a whitelisted event key", async () => {
    using _fetch = stub(globalThis, "fetch", emptyDbFetch());
    const res = await handler(
      postRequest({ action: "record_client_event", eventKey: "notification_settings_saved" }),
    );
    assertEquals(res.status, 200);
    assertEquals(await res.json(), []);
  });
});

// ---------------------------------------------------------------------------
// dashboard_visit action
// ---------------------------------------------------------------------------

describe("dashboard_visit action", () => {
  it("returns 200 with eligible achievements", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "user_garden_progress": (req) =>
          req.method === "PATCH" ? json(null) : json(PROGRESS_ROW),
        "notification_settings": () => json(null),
        "profiles": () => json(null),
        "/rest/v1/": () => json([]),
      }),
    );
    const res = await handler(postRequest({ action: "dashboard_visit" }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), []);
  });
});

// ---------------------------------------------------------------------------
// Unknown action
// ---------------------------------------------------------------------------

describe("unknown action", () => {
  it("returns 400 for an unrecognised action value", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(postRequest({ action: "do_something_weird" }));
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error, "Unknown action: do_something_weird");
  });
});
