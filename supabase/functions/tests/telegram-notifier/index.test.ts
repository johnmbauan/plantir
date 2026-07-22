/**
 * Integration tests for the telegram-notifier edge function.
 *
 * Strategy: intercept Deno.serve, stub Deno.env.get, then mock
 * Pool.prototype.connect (to avoid a real TCP connection) and
 * globalThis.fetch (for Telegram, Open-Meteo, and Supabase Realtime).
 */

import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import {
  interceptServe,
  routedFetch,
  stubEnv,
  TEST_CRON_API_KEY,
  TEST_ENV,
  TEST_SERVICE_ROLE_KEY,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

// ---------------------------------------------------------------------------
// Env constants for this function
// ---------------------------------------------------------------------------

const TELEGRAM_ENV = {
  ...TEST_ENV,
  TELEGRAM_BOT_TOKEN: "test-bot-token",
  SUPABASE_DB_URL: "postgres://test:test@localhost:5432/test",
};

// ---------------------------------------------------------------------------
// Mock PoolClient — returns empty rows for every query
// ---------------------------------------------------------------------------

function makePoolClient(responses: Array<{ rows: unknown[] }> = []) {
  let i = 0;
  return {
    queryObject: async () => ({ rows: (responses[i++] ?? { rows: [] }).rows }),
    release: () => {},
  };
}

function emptyPoolMocks() {
  const client = makePoolClient();
  const connectStub = stub(Pool.prototype, "connect", async () => client as any);
  const endStub = stub(Pool.prototype, "end", async () => {});
  return { connectStub, endStub, [Symbol.dispose]() { connectStub[Symbol.dispose](); endStub[Symbol.dispose](); } };
}

// ---------------------------------------------------------------------------
// Test setup — capture the Deno.serve handler once for the whole suite
// ---------------------------------------------------------------------------

let handler: EdgeHandler;
let restoreEnv: () => void;

beforeAll(async () => {
  restoreEnv = stubEnv(TELEGRAM_ENV);
  const intercept = interceptServe();
  await import("../../telegram-notifier/index.ts");
  intercept.restore();
  handler = intercept.getHandler();
});

afterAll(() => restoreEnv());

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

describe("environment validation", () => {
  it("returns 500 when TELEGRAM_BOT_TOKEN is missing", async () => {
    const restore = stubEnv({ ...TELEGRAM_ENV, TELEGRAM_BOT_TOKEN: undefined });
    try {
      const res = await handler(
        new Request("https://edge.fn/telegram-notifier", {
          headers: { apikey: TEST_SERVICE_ROLE_KEY },
        }),
      );
      assertEquals(res.status, 500);
      assertEquals((await res.json()).error, "Missing environment variables");
    } finally {
      restore();
    }
  });

  it("returns 500 when SUPABASE_DB_URL is missing", async () => {
    const restore = stubEnv({ ...TELEGRAM_ENV, SUPABASE_DB_URL: undefined });
    try {
      const res = await handler(
        new Request("https://edge.fn/telegram-notifier", {
          headers: { apikey: TEST_SERVICE_ROLE_KEY },
        }),
      );
      assertEquals(res.status, 500);
    } finally {
      restore();
    }
  });

  it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    const restore = stubEnv({ ...TELEGRAM_ENV, SUPABASE_SERVICE_ROLE_KEY: undefined });
    try {
      const res = await handler(
        new Request("https://edge.fn/telegram-notifier", {
          headers: { apikey: TEST_SERVICE_ROLE_KEY },
        }),
      );
      assertEquals(res.status, 500);
    } finally {
      restore();
    }
  });
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

describe("authentication", () => {
  it("returns 401 when the apikey header is absent", async () => {
    const res = await handler(new Request("https://edge.fn/telegram-notifier"));
    assertEquals(res.status, 401);
    assertEquals((await res.json()).error, "Unauthorized");
  });

  it("returns 401 when the apikey does not match either key", async () => {
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: "wrong-key" },
      }),
    );
    assertEquals(res.status, 401);
  });

  it("accepts the service role key as the apikey", async () => {
    using _pool = emptyPoolMocks();
    using _fetch = stub(globalThis, "fetch", routedFetch({}));
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: TEST_SERVICE_ROLE_KEY },
      }),
    );
    assertEquals(res.status, 200);
  });

  it("accepts the cron API key as the apikey", async () => {
    using _pool = emptyPoolMocks();
    using _fetch = stub(globalThis, "fetch", routedFetch({}));
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: TEST_CRON_API_KEY },
      }),
    );
    assertEquals(res.status, 200);
  });
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("happy path", () => {
  it("returns 200 with success=true when the DB is empty", async () => {
    using _pool = emptyPoolMocks();
    using _fetch = stub(globalThis, "fetch", routedFetch({}));
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: TEST_SERVICE_ROLE_KEY },
      }),
    );
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.success, true);
  });

  it("returns wateringAlertsSent=0 and offlineAlertsSent=0 with an empty DB", async () => {
    using _pool = emptyPoolMocks();
    using _fetch = stub(globalThis, "fetch", routedFetch({}));
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: TEST_SERVICE_ROLE_KEY },
      }),
    );
    const body = await res.json();
    assertEquals(body.wateringAlertsSent, 0);
    assertEquals(body.offlineAlertsSent, 0);
  });

  it("response includes details.watering and details.offline arrays", async () => {
    using _pool = emptyPoolMocks();
    using _fetch = stub(globalThis, "fetch", routedFetch({}));
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: TEST_SERVICE_ROLE_KEY },
      }),
    );
    const body = await res.json();
    assertEquals(Array.isArray(body.details?.watering), true);
    assertEquals(Array.isArray(body.details?.offline), true);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("error handling", () => {
  it("returns 500 with success=false when pool.connect throws", async () => {
    using _connect = stub(Pool.prototype, "connect", async () => {
      throw new Error("connection refused");
    });
    using _end = stub(Pool.prototype, "end", async () => {});
    const res = await handler(
      new Request("https://edge.fn/telegram-notifier", {
        headers: { apikey: TEST_SERVICE_ROLE_KEY },
      }),
    );
    assertEquals(res.status, 500);
    const body = await res.json();
    assertEquals(body.success, false);
    assertEquals(typeof body.error, "string");
  });
});
