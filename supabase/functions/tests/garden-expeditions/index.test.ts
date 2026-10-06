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
  TEST_CRON_API_KEY,
  TEST_ENV,
  TEST_SERVICE_ROLE_KEY,
} from "../utils/supabase_env.ts";
import type { EdgeHandler } from "../utils/supabase_env.ts";

function restOk() {
  return routedFetch({
    "/auth/v1/user": () => authOk(),
    "user_sanctuary": () => json(null),
    "/rest/v1/": () => json([]),
  });
}

function postRequest(body: Record<string, unknown> = { action: "bootstrap" }): Request {
  return new Request("https://edge.fn/garden-expeditions", {
    method: "POST",
    headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function cronRequest(apiKey: string, body: Record<string, unknown>): Request {
  return new Request("https://edge.fn/garden-expeditions", {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let handler: EdgeHandler;
let restoreEnv: () => void;
const testEnv: Record<string, string | undefined> = { ...TEST_ENV };

beforeAll(async () => {
  restoreEnv = stubEnv(testEnv);
  const intercept = interceptServe();
  await import("../../garden-expeditions/index.ts");
  intercept.restore();
  handler = intercept.getHandler();
});

afterAll(() => restoreEnv());

describe("method handling", () => {
  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await handler(
      new Request("https://edge.fn/garden-expeditions", {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Headers": "authorization,content-type" },
      }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), "authorization,content-type");
  });

  it("GET returns 405", async () => {
    const res = await handler(new Request("https://edge.fn/garden-expeditions", { method: "GET" }));
    assertEquals(res.status, 405);
  });
});

describe("environment", () => {
  it("returns 500 when required environment variables are missing", async () => {
    const previous = testEnv.SUPABASE_URL;
    testEnv.SUPABASE_URL = undefined;
    const res = await handler(postRequest());
    testEnv.SUPABASE_URL = previous;
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "Missing environment variables");
  });
});

describe("complete_due", () => {
  it("returns 401 without a valid apikey", async () => {
    const res = await handler(
      new Request("https://edge.fn/garden-expeditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_due" }),
      }),
    );
    assertEquals(res.status, 401);
  });

  it("accepts the service role key", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/rest/v1/": () => json([]) }),
    );
    const res = await handler(cronRequest(TEST_SERVICE_ROLE_KEY, { action: "complete_due" }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { success: true, completed: 0 });
  });

  it("accepts the cron api key", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/rest/v1/": () => json([]) }),
    );
    const res = await handler(cronRequest(TEST_CRON_API_KEY, { action: "complete_due" }));
    assertEquals(res.status, 200);
  });
});

describe("user authentication", () => {
  it("returns 401 when Authorization is missing", async () => {
    const res = await handler(
      new Request("https://edge.fn/garden-expeditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bootstrap" }),
      }),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the token is rejected", async () => {
    using _fetch = stub(globalThis, "fetch", routedFetch({ "/auth/v1/user": () => authFail() }));
    const res = await handler(postRequest());
    assertEquals(res.status, 401);
  });
});

describe("user actions", () => {
  it("bootstraps by default when the body is empty or invalid", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const empty = await handler(postRequest({}));
    assertEquals(empty.status, 200);
    const invalid = await handler(
      new Request("https://edge.fn/garden-expeditions", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER },
        body: "not-json",
      }),
    );
    assertEquals(invalid.status, 200);
  });

  it("grant_care bootstraps the sanctuary", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({ action: "grant_care" }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { success: true });
  });

  it("returns 400 when depart fields are missing", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({ action: "depart" }));
    assertEquals(res.status, 400);
  });

  it("returns 500 when depart validation fails", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({
      action: "depart",
      destinationId: "first_outing",
      durationKey: "instant",
      team: [],
    }));
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "Team must have one to three creatures");
  });

  it("returns 400 when cancel is missing expeditionId", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({ action: "cancel" }));
    assertEquals(res.status, 400);
  });

  it("cancels an expedition", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "user_expeditions": () => json({ id: "e1" }),
        "/rest/v1/": () => json([]),
      }),
    );
    const res = await handler(postRequest({ action: "cancel", expeditionId: "e1" }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { success: true });
  });

  it("returns 400 when welcome is missing expeditionId", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({ action: "welcome" }));
    assertEquals(res.status, 400);
  });

  it("returns 500 when welcome is not ready", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "user_expeditions": () => json(null),
        "/rest/v1/": () => json([]),
      }),
    );
    const res = await handler(postRequest({ action: "welcome", expeditionId: "e1" }));
    assertEquals(res.status, 500);
  });

  it("marks intro complete", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({ action: "mark_intro" }));
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { success: true });
  });

  it("returns 400 for an unknown action", async () => {
    using _fetch = stub(globalThis, "fetch", restOk());
    const res = await handler(postRequest({ action: "do_something_weird" }));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "Unknown action: do_something_weird");
  });
});
