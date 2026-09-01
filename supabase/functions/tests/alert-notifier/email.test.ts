import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "jsr:@std/testing/mock";
import { sendEmailDigests } from "../../alert-notifier/email.ts";
import type { OfflineDigestItem, WateringDigestItem } from "../../alert-notifier/types.ts";
import { json } from "../utils/supabase_env.ts";

const APP_ORIGIN = "https://plantir.green";
const FROM = "Plantir <alerts@plantir.green>";
const API_KEY = "re_test";

function makeClient(responses: Array<{ rows: unknown[] }> = []) {
  const sqls: string[] = [];
  let i = 0;
  return {
    sqls,
    queryObject: async (sql: string) => {
      sqls.push(sql);
      return { rows: (responses[i++] ?? { rows: [] }).rows };
    },
  };
}

function wateringItem(overrides: Partial<WateringDigestItem> = {}): WateringDigestItem {
  return {
    userId: "user-1",
    email: "a@b.com",
    locale: "en",
    notificationTimezone: "UTC",
    plantName: "Basil",
    humidity: 18,
    rainNote: "",
    ...overrides,
  };
}

function offlineItem(overrides: Partial<OfflineDigestItem> = {}): OfflineDigestItem {
  return {
    userId: "user-1",
    email: "a@b.com",
    locale: "en",
    notificationTimezone: "UTC",
    plantName: "Monstera",
    lastSeenAt: null,
    ...overrides,
  };
}

describe("sendEmailDigests", () => {
  it("skips sending when the Resend API key is missing", async () => {
    using warnStub = stub(console, "warn", () => {});
    const client = makeClient();
    const result = await sendEmailDigests(
      client as any,
      [wateringItem()],
      [],
      undefined,
      FROM,
      APP_ORIGIN,
    );
    assertEquals(result, { sent: 0, skipped: 0 });
    assertEquals(client.sqls.length, 0);
    assertSpyCall(warnStub, 0, {
      args: ["Skipping email digests: RESEND_API_KEY or RESEND_FROM is not set"],
    });
  });

  it("does not warn when there is nothing to send and secrets are missing", async () => {
    using warnStub = stub(console, "warn", () => {});
    const result = await sendEmailDigests(
      makeClient() as any,
      [],
      [],
      undefined,
      undefined,
      APP_ORIGIN,
    );
    assertEquals(result, { sent: 0, skipped: 0 });
    assertSpyCalls(warnStub, 0);
  });

  it("sends one combined digest per user", async () => {
    const client = makeClient([{ rows: [{ userId: "user-1" }] }]);
    using fetchStub = stub(globalThis, "fetch", async () => json({ id: "re_1" }));

    const result = await sendEmailDigests(
      client as any,
      [wateringItem()],
      [offlineItem()],
      API_KEY,
      FROM,
      APP_ORIGIN,
    );

    assertEquals(result, { sent: 1, skipped: 0 });
    assertSpyCalls(fetchStub, 1);
    const body = JSON.parse((fetchStub.calls[0].args[1] as RequestInit).body as string);
    assertEquals(body.to, ["a@b.com"]);
    assertEquals(body.from, FROM);
    assertEquals(body.subject, "Basil needs water · Monstera is offline");
    assertEquals(client.sqls[0].includes("INSERT INTO notification_email_log"), true);
  });

  it("skips a user already logged for today", async () => {
    const client = makeClient([{ rows: [] }]);
    using fetchStub = stub(globalThis, "fetch", async () => json({ id: "re_1" }));
    const result = await sendEmailDigests(
      client as any,
      [wateringItem()],
      [],
      API_KEY,
      FROM,
      APP_ORIGIN,
    );
    assertEquals(result, { sent: 0, skipped: 1 });
    assertSpyCalls(fetchStub, 0);
  });

  it("releases the send slot when Resend fails", async () => {
    const client = makeClient([{ rows: [{ userId: "user-1" }] }, { rows: [] }]);
    using _fetch = stub(
      globalThis,
      "fetch",
      async () => new Response("boom", { status: 500 }),
    );
    using errorStub = stub(console, "error", () => {});

    const result = await sendEmailDigests(
      client as any,
      [wateringItem()],
      [],
      API_KEY,
      FROM,
      APP_ORIGIN,
    );

    assertEquals(result, { sent: 0, skipped: 1 });
    assertEquals(client.sqls[1].includes("DELETE FROM notification_email_log"), true);
    assertSpyCalls(errorStub, 1);
  });

  it("skips a user with an empty email without claiming a slot", async () => {
    const client = makeClient();
    using fetchStub = stub(globalThis, "fetch", async () => json({ id: "re_1" }));
    const result = await sendEmailDigests(
      client as any,
      [wateringItem({ email: "" })],
      [],
      API_KEY,
      FROM,
      APP_ORIGIN,
    );
    assertEquals(result, { sent: 0, skipped: 1 });
    assertEquals(client.sqls.length, 0);
    assertSpyCalls(fetchStub, 0);
  });

  it("sends a separate email per user", async () => {
    const client = makeClient([
      { rows: [{ userId: "user-1" }] },
      { rows: [{ userId: "user-2" }] },
    ]);
    using fetchStub = stub(globalThis, "fetch", async () => json({ id: "re_1" }));

    const result = await sendEmailDigests(
      client as any,
      [
        wateringItem({ userId: "user-1", email: "one@x.com", plantName: "Basil" }),
        wateringItem({ userId: "user-2", email: "two@x.com", plantName: "Fern" }),
      ],
      [],
      API_KEY,
      FROM,
      APP_ORIGIN,
    );

    assertEquals(result, { sent: 2, skipped: 0 });
    assertSpyCalls(fetchStub, 2);
    const first = JSON.parse((fetchStub.calls[0].args[1] as RequestInit).body as string);
    const second = JSON.parse((fetchStub.calls[1].args[1] as RequestInit).body as string);
    assertEquals(first.to, ["one@x.com"]);
    assertEquals(second.to, ["two@x.com"]);
  });
});
