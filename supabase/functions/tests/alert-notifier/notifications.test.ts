import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "jsr:@std/testing/mock";
import { createInAppNotification } from "../../alert-notifier/notifications.ts";
import { routedFetch } from "../utils/supabase_env.ts";

const SUPABASE_URL = "https://test.supabase.co";
const SERVICE_KEY = "test-service-key";
const USER_ID = "user-uuid-123";

// ---------------------------------------------------------------------------
// Mock PoolClient
// ---------------------------------------------------------------------------

/**
 * Builds a minimal PoolClient stub.
 * Each call to queryObject returns the next item in `responses`.
 * Falls back to `{ rows: [] }` when the sequence is exhausted.
 */
function makeClient(responses: Array<{ rows: unknown[] }> = []) {
  let i = 0;
  return {
    queryObject: async () => ({ rows: (responses[i++] ?? { rows: [] }).rows }),
    release: () => {},
  };
}

function notifRow(id = "notif-id-1") {
  return { id, created_at: "2024-01-01T00:00:00Z" };
}

function realtimeMock() {
  return routedFetch({ "realtime": () => new Response(null, { status: 200 }) });
}

// ---------------------------------------------------------------------------
// createInAppNotification — watering type
// ---------------------------------------------------------------------------

describe("createInAppNotification (watering)", () => {
  describe("insert path (no existing notification)", () => {
    it("returns the new notification id after a successful insert", async () => {
      const client = makeClient([
        { rows: [] },            // findExisting → no row
        { rows: [notifRow()] },  // INSERT → new row
      ]);
      using _fetch = stub(globalThis, "fetch", realtimeMock());
      const id = await createInAppNotification(
        client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
        "watering", "Rose needs water", "Humidity: 15%", { plantId: 7, plantName: "Rose" },
      );
      assertEquals(id, "notif-id-1");
    });

    it("returns null when the INSERT returns no row", async () => {
      const client = makeClient([
        { rows: [] },
        { rows: [] }, // INSERT returned nothing
      ]);
      using _fetch = stub(globalThis, "fetch", realtimeMock());
      const id = await createInAppNotification(
        client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
        "watering", "title", "body", { plantId: 1 },
      );
      assertEquals(id, null);
    });
  });

  describe("update path (existing unread notification)", () => {
    it("returns the updated notification id", async () => {
      const client = makeClient([
        { rows: [notifRow("existing-id")] }, // findExisting → existing row
        { rows: [notifRow("existing-id")] }, // UPDATE → updated row
      ]);
      using _fetch = stub(globalThis, "fetch", realtimeMock());
      const id = await createInAppNotification(
        client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
        "watering", "title", "body", { plantId: 7 },
      );
      assertEquals(id, "existing-id");
    });
  });
});

// ---------------------------------------------------------------------------
// createInAppNotification — offline type
// ---------------------------------------------------------------------------

describe("createInAppNotification (offline)", () => {
  it("inserts a new offline notification when none exists", async () => {
    const client = makeClient([
      { rows: [] }, // findExisting → no row
      { rows: [notifRow("offline-notif")] }, // INSERT → new row
    ]);
    using _fetch = stub(globalThis, "fetch", realtimeMock());
    const id = await createInAppNotification(
      client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
      "offline", "2 sensors offline", "Monstera and Rose haven't reported in", { plants: [] },
    );
    assertEquals(id, "offline-notif");
  });

  it("updates an existing unread offline notification", async () => {
    const client = makeClient([
      { rows: [notifRow("old-offline")] }, // findExisting → existing row
      { rows: [notifRow("old-offline")] }, // UPDATE → updated row
    ]);
    using _fetch = stub(globalThis, "fetch", realtimeMock());
    const id = await createInAppNotification(
      client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
      "offline", "title", "body", { plants: [] },
    );
    assertEquals(id, "old-offline");
  });
});

// ---------------------------------------------------------------------------
// Realtime broadcast
// ---------------------------------------------------------------------------

describe("realtime broadcast", () => {
  it("broadcasts the complete notification payload to the user topic", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [notifRow()] },
    ]);
    using fetchStub = stub(globalThis, "fetch", async () => new Response(null, { status: 200 }));
    await createInAppNotification(
      client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
      "watering", "title", "body", { plantId: 3 },
    );
    assertSpyCalls(fetchStub, 1);
    assertSpyCall(fetchStub, 0, {
      args: [
        `${SUPABASE_URL}/realtime/v1/api/broadcast`,
        {
          method: "POST",
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{
              topic: `user:${USER_ID}`,
              event: "notification_created",
              payload: {
                id: "notif-id-1",
                type: "watering",
                title: "title",
                body: "body",
                payload: { plantId: 3 },
                created_at: "2024-01-01T00:00:00Z",
              },
              private: true,
            }],
          }),
        },
      ],
    });
  });

  it("logs a warning but still returns the id when broadcast returns non-ok", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [notifRow()] },
    ]);
    using _fetch = stub(
      globalThis,
      "fetch",
      () => Promise.resolve(new Response("broadcast failed", { status: 500 })),
    );
    using errorStub = stub(console, "error", () => {});
    const id = await createInAppNotification(
      client as any, SUPABASE_URL, SERVICE_KEY, USER_ID,
      "watering", "title", "body", { plantId: 1 },
    );
    assertEquals(id, "notif-id-1");
    assertSpyCall(errorStub, 0, {
      args: ["Realtime broadcast error:", "broadcast failed"],
    });
  });
});
