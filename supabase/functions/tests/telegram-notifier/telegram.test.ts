import { describe, it } from "jsr:@std/testing/bdd";
import { assertSpyCall, assertSpyCalls, stub } from "jsr:@std/testing/mock";
import { sendTelegramMessage, sendTelegramPhoto } from "../../telegram-notifier/telegram.ts";
import { json } from "../utils/supabase_env.ts";

const BOT_TOKEN = "test-bot-token-123";
const CHAT_ID = "987654321";

// ---------------------------------------------------------------------------
// sendTelegramMessage
// ---------------------------------------------------------------------------

describe("sendTelegramMessage", () => {
  describe("request format", () => {
    it("sends the correct POST request to the sendMessage endpoint", async () => {
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      await sendTelegramMessage(BOT_TOKEN, CHAT_ID, "test message");
      assertSpyCalls(fetchStub, 1);
      assertSpyCall(fetchStub, 0, {
        args: [
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: "test message" }),
          },
        ],
      });
    });
  });

  describe("error handling", () => {
    it("logs an error when the Telegram response has ok=false", async () => {
      using _fetch = stub(globalThis, "fetch", async () =>
        json({ ok: false, description: "Forbidden" })
      );
      using errorStub = stub(console, "error", () => {});
      await sendTelegramMessage(BOT_TOKEN, CHAT_ID, "msg");
      assertSpyCall(errorStub, 0, {
        args: ["Telegram sendMessage error:", "Forbidden"],
      });
    });

    it("does not throw even when ok=false", async () => {
      using _fetch = stub(globalThis, "fetch", async () =>
        json({ ok: false, description: "Bad Request" })
      );
      await sendTelegramMessage(BOT_TOKEN, CHAT_ID, "msg");
    });
  });
});

// ---------------------------------------------------------------------------
// sendTelegramPhoto
// ---------------------------------------------------------------------------

describe("sendTelegramPhoto", () => {
  describe("request format", () => {
    it("sends the correct POST request to the sendPhoto endpoint", async () => {
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      await sendTelegramPhoto(BOT_TOKEN, CHAT_ID, "https://img.example.com/p.jpg", "My caption");
      assertSpyCalls(fetchStub, 1);
      assertSpyCall(fetchStub, 0, {
        args: [
          `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: CHAT_ID,
              photo: "https://img.example.com/p.jpg",
              caption: "My caption",
            }),
          },
        ],
      });
    });
  });

  describe("error handling", () => {
    it("logs an error when the Telegram response has ok=false", async () => {
      using _fetch = stub(globalThis, "fetch", async () =>
        json({ ok: false, description: "Photo too large" })
      );
      using errorStub = stub(console, "error", () => {});
      await sendTelegramPhoto(BOT_TOKEN, CHAT_ID, "url", "cap");
      assertSpyCall(errorStub, 0, {
        args: ["Telegram sendPhoto error:", "Photo too large"],
      });
    });

    it("does not throw even when ok=false", async () => {
      using _fetch = stub(globalThis, "fetch", async () =>
        json({ ok: false, description: "Bad Request" })
      );
      await sendTelegramPhoto(BOT_TOKEN, CHAT_ID, "url", "cap");
    });
  });
});
