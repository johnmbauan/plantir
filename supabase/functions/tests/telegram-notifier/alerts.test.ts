import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "jsr:@std/testing/mock";
import { sendOfflineAlerts, sendWateringAlerts } from "../../telegram-notifier/alerts.ts";
import type { OfflineRow, WateringRow } from "../../telegram-notifier/types.ts";
import { json, routedFetch } from "../utils/supabase_env.ts";

const BOT_TOKEN = "test-bot-token";
const SUPABASE_URL = "https://test.supabase.co";
const SERVICE_KEY = "test-service-key";

// ---------------------------------------------------------------------------
// Mock PoolClient
// ---------------------------------------------------------------------------

/**
 * Returns a minimal PoolClient mock that answers queries in sequence.
 * Exhausted slots default to `{ rows: [] }`.
 */
function makeClient(responses: Array<{ rows: unknown[] }> = []) {
  let i = 0;
  return {
    queryObject: async () => ({ rows: (responses[i++] ?? { rows: [] }).rows }),
    release: () => {},
  };
}

function notifRow() {
  return { id: "notif-1", created_at: "2024-01-01T00:00:00Z" };
}

// ---------------------------------------------------------------------------
// Row factories
// ---------------------------------------------------------------------------

function makeWateringRow(overrides: Partial<WateringRow> = {}): WateringRow {
  return {
    userId: "user-1",
    chatId: "chat-1",
    browserEnabled: false,
    plantId: 1,
    plantName: "Monstera",
    imageUrl: null,
    humidity: 20,
    isOutdoor: false,
    weatherLat: null,
    weatherLng: null,
    ...overrides,
  };
}

function makeOfflineRow(overrides: Partial<OfflineRow> = {}): OfflineRow {
  return {
    userId: "user-1",
    chatId: "chat-1",
    browserEnabled: false,
    plantId: 1,
    plantName: "Monstera",
    lastSeenAt: "2024-01-01T12:00:00Z",
    notificationTimezone: "UTC",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// sendWateringAlerts
// ---------------------------------------------------------------------------

describe("sendWateringAlerts", () => {
  describe("empty results", () => {
    it("returns an empty array when the query returns no rows", async () => {
      const client = makeClient([{ rows: [] }]);
      assertEquals(
        await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY),
        [],
      );
    });
  });

  describe("Telegram delivery", () => {
    it("sends a text message when chatId is set and imageUrl is null", async () => {
      const client = makeClient([
        { rows: [makeWateringRow()] }, // WATERING_QUERY
        { rows: [] },                  // nothing snoozed
      ]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCalls(fetchStub, 1);
      assertSpyCall(fetchStub, 0, {
        args: [
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: "chat-1", text: "⚠️ Warning! Plant Monstera needs water! Humidity reading: 20%" }),
          },
        ],
      });
      assertEquals(result[0].telegram, true);
    });

    it("sends a photo message when imageUrl is present", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ imageUrl: "https://img.url/plant.jpg" })] },
        { rows: [] }, // nothing snoozed
      ]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCalls(fetchStub, 1);
      assertSpyCall(fetchStub, 0, {
        args: [
          `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: "chat-1",
              photo: "https://img.url/plant.jpg",
              caption: "⚠️ Warning! Plant Monstera needs water! Humidity reading: 20%",
            }),
          },
        ],
      });
      assertEquals(result[0].telegram, true);
    });

    it("marks telegram=false when Telegram throws a network error", async () => {
      const client = makeClient([
        { rows: [makeWateringRow()] },
        { rows: [] }, 
      ]);
      using _fetch = stub(globalThis, "fetch", async () => {
        throw new Error("Network failure");
      });
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].telegram, false);
    });

    it("skips Telegram when chatId is empty", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ chatId: "" })] }, // chatId is empty
        { rows: [] }, // nothing snoozed
      ]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCalls(fetchStub, 0);
      assertEquals(result[0].telegram, false);
    });
  });

  describe("browser in-app notification", () => {
    it("creates a browser notification and marks browser=true", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ chatId: "", browserEnabled: true })] },
        { rows: [] },            // nothing snoozed
        { rows: [] },            // findExisting → no row
        { rows: [notifRow()] },  // INSERT
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "realtime": () => new Response(null, { status: 200 }),
      }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].browser, true);
    });

    it("marks browser=false when browserEnabled is false", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ browserEnabled: false })] },
        { rows: [] },
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "sendMessage": () => json({ ok: true }),
      }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].browser, false);
    });
  });

  describe("snooze filtering", () => {
    it("omits a plant whose userId:plantId is in the snoozed set", async () => {
      const client = makeClient([
        { rows: [makeWateringRow()] },
        { rows: [{ userId: "user-1", plantId: 1 }] }, // plant 1 snoozed
      ]);
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result.length, 0);
    });

    it("includes a plant that belongs to a different user than the snoozed one", async () => {
      const client = makeClient([
        { rows: [makeWateringRow()] },
        { rows: [{ userId: "other-user", plantId: 1 }] }, // different user snoozed
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "sendMessage": () => json({ ok: true }),
      }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result.length, 1);
    });
  });

  describe("rain forecast integration", () => {
    it("sets rainNote=true for outdoor plants when rain is forecast", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ isOutdoor: true, weatherLat: 48.8, weatherLng: 2.3 })] },
        { rows: [] },
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => json({ daily: { weather_code: [51, 0] } }),
        "sendMessage": () => json({ ok: true }),
      }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].rainNote, true);
    });

    it("sets rainNote=false for outdoor plants when no rain is forecast", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ isOutdoor: true, weatherLat: 48.8, weatherLng: 2.3 })] },
        { rows: [] },
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "open-meteo.com": () => json({ daily: { weather_code: [0, 1] } }),
        "sendMessage": () => json({ ok: true }),
      }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].rainNote, false);
    });

    it("sets rainNote=false for indoor plants regardless of forecast", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ isOutdoor: false })] },
        { rows: [] },
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "sendMessage": () => json({ ok: true }),
      }));
      const result = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].rainNote, false);
    });
  });

  describe("result shape", () => {
    it("returns plant name and numeric humidity for each alert", async () => {
      const client = makeClient([
        { rows: [makeWateringRow({ plantName: "Rose", humidity: 15 })] },
        { rows: [] },
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "sendMessage": () => json({ ok: true }),
      }));
      const [alert] = await sendWateringAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(alert.plant, "Rose");
      assertEquals(alert.humidity, 15);
    });
  });
});

// ---------------------------------------------------------------------------
// sendOfflineAlerts
// ---------------------------------------------------------------------------

describe("sendOfflineAlerts", () => {
  describe("empty results", () => {
    it("returns an empty array when the query returns no rows", async () => {
      const client = makeClient([{ rows: [] }]);
      assertEquals(
        await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY),
        [],
      );
    });
  });

  describe("Telegram delivery", () => {
    it("sends one message for a single offline plant", async () => {
      const client = makeClient([{ rows: [makeOfflineRow()] }]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      const result = await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCalls(fetchStub, 1);
      assertEquals(result[0].telegram, true);
      assertEquals(result[0].browser, false);
    });

    it("groups multiple offline plants under the same chatId into a single message", async () => {
      const client = makeClient([{
        rows: [
          makeOfflineRow({ plantId: 1, plantName: "Rose" }),
          makeOfflineRow({ plantId: 2, plantName: "Orchid" }),
        ],
      }]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      const result = await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCalls(fetchStub, 1);
      assertEquals(result.length, 2);
    });

    it("sends separate messages for plants on different chatIds", async () => {
      const client = makeClient([{
        rows: [
          makeOfflineRow({ plantId: 1, chatId: "chat-A" }),
          makeOfflineRow({ plantId: 2, chatId: "chat-B" }),
        ],
      }]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCalls(fetchStub, 2);
    });

    it("sends the full offline message with 'never seen' when lastSeenAt is null", async () => {
      const client = makeClient([{ rows: [makeOfflineRow({ lastSeenAt: null })] }]);
      using fetchStub = stub(globalThis, "fetch", async () => json({ ok: true }));
      await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertSpyCall(fetchStub, 0, {
        args: [
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: "chat-1",
              text: "🔴 Warning! The devices for the following plants haven't sent data in too long (possible low battery or malfunction):\n\n• Monstera (never seen)",
            }),
          },
        ],
      });
    });
  });

  describe("browser in-app notification", () => {
    it("creates a browser notification and marks browser=true for browserEnabled plants", async () => {
      const client = makeClient([
        { rows: [makeOfflineRow({ chatId: "", browserEnabled: true })] },
        { rows: [] },            // findExisting
        { rows: [notifRow()] },  // INSERT
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "realtime": () => new Response(null, { status: 200 }),
      }));
      const result = await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].browser, true);
    });

    it("groups all offline plants for the same userId into one browser notification", async () => {
      const client = makeClient([
        {
          rows: [
            makeOfflineRow({ plantId: 1, plantName: "Fern", chatId: "", browserEnabled: true }),
            makeOfflineRow({ plantId: 2, plantName: "Cactus", chatId: "", browserEnabled: true }),
          ],
        },
        { rows: [] },           // findExisting
        { rows: [notifRow()] }, // INSERT
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "realtime": () => new Response(null, { status: 200 }),
      }));
      const result = await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result.length, 2);
      assertEquals(result.every((r) => r.browser), true);
    });
  });

  describe("combined Telegram + browser", () => {
    it("sets both telegram=true and browser=true for a plant on both channels", async () => {
      const client = makeClient([
        { rows: [makeOfflineRow({ browserEnabled: true })] },
        { rows: [] },
        { rows: [notifRow()] },
      ]);
      using _fetch = stub(globalThis, "fetch", routedFetch({
        "sendMessage": () => json({ ok: true }),
        "realtime": () => new Response(null, { status: 200 }),
      }));
      const result = await sendOfflineAlerts(client as any, BOT_TOKEN, SUPABASE_URL, SERVICE_KEY);
      assertEquals(result[0].telegram, true);
      assertEquals(result[0].browser, true);
    });
  });
});
