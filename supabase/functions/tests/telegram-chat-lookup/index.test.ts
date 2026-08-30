/**
 * Integration tests for the telegram-chat-lookup edge function.
 *
 * Strategy: intercept Deno.serve, stub Deno.env.get, then mock globalThis.fetch
 * per test to cover auth, input validation, and Telegram API outcomes.
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

const BOT_TOKEN = "test-bot-token";

const testEnv: Record<string, string | undefined> = {
  ...TEST_ENV,
  TELEGRAM_BOT_TOKEN: BOT_TOKEN,
};

let handler: EdgeHandler;
let restoreEnv: () => void;

beforeAll(async () => {
  restoreEnv = stubEnv(testEnv);
  const intercept = interceptServe();
  await import("../../telegram-chat-lookup/index.ts");
  intercept.restore();
  handler = intercept.getHandler();
});

afterAll(() => restoreEnv());

function lookupRequest(chatId: unknown, auth = TEST_AUTH_HEADER): Request {
  return new Request("https://edge.fn/telegram-chat-lookup", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ chatId }),
  });
}

function telegramOk(result: Record<string, unknown>): Response {
  return json({ ok: true, result });
}

function telegramFail(error_code: number, description: string): Response {
  return json({ ok: false, error_code, description });
}

describe("method handling", () => {
  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await handler(
      new Request("https://edge.fn/telegram-chat-lookup", { method: "OPTIONS" }),
    );
    assertEquals(res.status, 204);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(res.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  });

  it("GET returns 405", async () => {
    const res = await handler(
      new Request("https://edge.fn/telegram-chat-lookup", { method: "GET" }),
    );
    assertEquals(res.status, 405);
  });
});

describe("environment", () => {
  it("returns 500 when SUPABASE_URL is missing", async () => {
    const restore = stubEnv({ ...testEnv, SUPABASE_URL: undefined });
    try {
      const res = await handler(lookupRequest("123456789"));
      assertEquals(res.status, 500);
    } finally {
      restore();
    }
  });

  it("returns 500 when TELEGRAM_BOT_TOKEN is missing", async () => {
    const restore = stubEnv({ ...testEnv, TELEGRAM_BOT_TOKEN: undefined });
    try {
      const res = await handler(lookupRequest("123456789"));
      assertEquals(res.status, 500);
    } finally {
      restore();
    }
  });
});

describe("authentication", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await handler(
      new Request("https://edge.fn/telegram-chat-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: "123456789" }),
      }),
    );
    assertEquals(res.status, 401);
  });

  it("returns 401 when the token is invalid", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authFail() }),
    );
    const res = await handler(lookupRequest("123456789", "Bearer bad-token"));
    assertEquals(res.status, 401);
  });
});

describe("input validation", () => {
  it("returns 400 for an empty chatId", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(lookupRequest(""));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "invalid_chat_id");
  });

  it("returns 400 for a non-numeric chatId", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(lookupRequest("not-a-number"));
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "invalid_chat_id");
  });

  it("returns 400 when chatId is omitted", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({ "/auth/v1/user": () => authOk() }),
    );
    const res = await handler(
      new Request("https://edge.fn/telegram-chat-lookup", {
        method: "POST",
        headers: { Authorization: TEST_AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "invalid_chat_id");
  });

  it("accepts a negative group chat ID", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramOk({ type: "supergroup", title: "Plant Lovers", username: "plantlovers" }),
      }),
    );
    const res = await handler(lookupRequest("-1001234567890"));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).type, "supergroup");
  });
});

describe("Telegram API outcomes", () => {
  it("returns 200 with name fields for a private chat", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramOk({ type: "private", first_name: "John", last_name: "Doe", username: "johndoe" }),
      }),
    );
    const res = await handler(lookupRequest("123456789"));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.type, "private");
    assertEquals(body.firstName, "John");
    assertEquals(body.lastName, "Doe");
    assertEquals(body.username, "johndoe");
  });

  it("returns 200 with title for a group", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramOk({ type: "group", title: "Garden Club" }),
      }),
    );
    const res = await handler(lookupRequest("-100999888777"));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.type, "group");
    assertEquals(body.title, "Garden Club");
  });

  it("returns 200 with title and username for a channel", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramOk({ type: "channel", title: "My Garden Updates", username: "mygarден" }),
      }),
    );
    const res = await handler(lookupRequest("-100444555666"));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.type, "channel");
    assertEquals(body.title, "My Garden Updates");
  });

  it("omits undefined fields from the response", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramOk({ type: "private", first_name: "Alice" }),
      }),
    );
    const res = await handler(lookupRequest("111222333"));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.firstName, "Alice");
    assertEquals(body.lastName, undefined);
    assertEquals(body.username, undefined);
  });

  it("returns chat_not_found when Telegram cannot see a personal chat", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramFail(400, "Bad Request: chat not found"),
      }),
    );
    const res = await handler(lookupRequest("999999999"));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).error, "chat_not_found");
  });

  it("returns bot_not_in_chat when Telegram cannot see a group chat", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramFail(400, "Bad Request: chat not found"),
      }),
    );
    const res = await handler(lookupRequest("-1001234567890"));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).error, "bot_not_in_chat");
  });

  it("returns bot_not_in_chat when the bot was kicked from the group", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramFail(403, "Forbidden: bot was kicked from the group chat"),
      }),
    );
    const res = await handler(lookupRequest("-100123456789"));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).error, "bot_not_in_chat");
  });

  it("returns telegram_error for an unexpected Telegram failure", async () => {
    using _fetch = stub(
      globalThis,
      "fetch",
      routedFetch({
        "/auth/v1/user": () => authOk(),
        "api.telegram.org": () =>
          telegramFail(500, "Internal Server Error"),
      }),
    );
    const res = await handler(lookupRequest("123456789"));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).error, "telegram_error");
  });
});
