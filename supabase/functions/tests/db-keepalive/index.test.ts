import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import {
  interceptServe,
  routedFetch,
  stubEnv,
  TEST_CRON_API_KEY,
  TEST_ENV,
  TEST_SERVICE_ROLE_KEY,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

let handler: EdgeHandler;
let restoreEnv: () => void;

beforeAll(async () => {
  restoreEnv = stubEnv(TEST_ENV);
  const intercept = interceptServe();
  await import("../../db-keepalive/index.ts");
  intercept.restore();
  handler = intercept.getHandler();
});

afterAll(() => restoreEnv());

function keepaliveRequest(headers: HeadersInit = { apikey: TEST_CRON_API_KEY }): Request {
  return new Request("https://edge.fn/db-keepalive", {
    method: "POST",
    headers,
  });
}

describe("db-keepalive", () => {
  it("returns 401 when the apikey header is absent", async () => {
    const res = await handler(keepaliveRequest({}));
    assertEquals(res.status, 401);
  });

  it("returns 401 when the apikey does not match", async () => {
    const res = await handler(keepaliveRequest({ apikey: "wrong" }));
    assertEquals(res.status, 401);
  });

  it("returns 500 when required env vars are missing", async () => {
    const restore = stubEnv({ ...TEST_ENV, SUPABASE_URL: undefined });
    try {
      const res = await handler(keepaliveRequest());
      assertEquals(res.status, 500);
    } finally {
      restore();
    }
  });

  it("accepts the cron API key and pings PostgREST", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "rest/v1/devices": () =>
          new Response(JSON.stringify([{ id: 1 }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    );

    const res = await handler(keepaliveRequest({ apikey: TEST_CRON_API_KEY }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { ok: true });
  });

  it("accepts the service role key", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "rest/v1/devices": () =>
          new Response(JSON.stringify([{ id: 1 }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    );

    const res = await handler(keepaliveRequest({ apikey: TEST_SERVICE_ROLE_KEY }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { ok: true });
  });

  it("returns 500 when PostgREST ping fails", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "rest/v1/devices": () =>
          new Response(JSON.stringify({ message: "boom", code: "XX000" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    );

    const res = await handler(keepaliveRequest());
    assertEquals(res.status, 500);
    const body = await res.json();
    assertEquals(body.ok, false);
  });
});
