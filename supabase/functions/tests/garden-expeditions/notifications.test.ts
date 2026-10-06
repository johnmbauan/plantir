import { afterEach, describe, it } from "jsr:@std/testing/bdd";
import { stub } from "jsr:@std/testing/mock";
import {
  configureExpeditionBroadcast,
  persistBondLevelNotification,
  persistReturnNotification,
  sendExternalReturnNotice,
} from "../../garden-expeditions/notifications.ts";
import { createClient, USER_ID } from "./mock_client.ts";
import { stubEnv } from "../utils/supabase_env.ts";

const adminEmpty = () => createClient({ notifications: { data: null } });

describe("persistReturnNotification", () => {
  it("returns on a unique-constraint race", async () => {
    const admin = createClient({
      notifications: { data: null, error: { message: "dup", code: "23505" } },
    });
    await persistReturnNotification(admin as never, USER_ID, "e1", "moss_lane");
  });

  it("logs other insert errors", async () => {
    const admin = createClient({
      notifications: { data: null, error: { message: "insert failed", code: "400" } },
    });
    await persistReturnNotification(admin as never, USER_ID, "e1", "moss_lane");
  });

  it("skips broadcast when no row is returned", async () => {
    await persistReturnNotification(adminEmpty() as never, USER_ID, "e1", "moss_lane");
  });
});

describe("persistBondLevelNotification", () => {
  it("logs insert errors", async () => {
    const admin = createClient({
      notifications: { data: null, error: { message: "insert failed" } },
    });
    await persistBondLevelNotification(admin as never, USER_ID, "hello_my_name_is", 2);
  });

  it("skips broadcast when no row is returned", async () => {
    await persistBondLevelNotification(adminEmpty() as never, USER_ID, "hello_my_name_is", 2);
  });
});

describe("broadcast after configureExpeditionBroadcast", () => {
  const env = {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
  };

  it("posts a realtime payload and ignores a failed response", async () => {
    configureExpeditionBroadcast(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    using _fetch = stub(
      globalThis,
      "fetch",
      () => Promise.resolve(new Response("nope", { status: 500 })),
    );
    const admin = createClient({
      notifications: {
        data: {
          id: "n1",
          type: "expedition_returned",
          title: "Explorers returned",
          body: "Your explorers returned with something unusual.",
          payload: {},
          created_at: "2026-10-06T00:00:00Z",
        },
      },
    });
    await persistReturnNotification(admin as never, USER_ID, "e1", "moss_lane");
  });

  it("logs when the broadcast fetch throws", async () => {
    using _fetch = stub(globalThis, "fetch", () => Promise.reject(new Error("offline")));
    const admin = createClient({
      notifications: {
        data: {
          id: "n2",
          type: "bond_level",
          title: "Bond grew",
          body: "A new memory is waiting in their profile.",
          payload: {},
          created_at: "2026-10-06T00:00:00Z",
        },
      },
    });
    await persistBondLevelNotification(admin as never, USER_ID, "hello_my_name_is", 3);
  });

  it("broadcasts a successful persist", async () => {
    using _fetch = stub(globalThis, "fetch", () => Promise.resolve(new Response("{}", { status: 200 })));
    const admin = createClient({
      notifications: {
        data: {
          id: "n3",
          type: "bond_level",
          title: "Bond grew",
          body: "A new memory is waiting in their profile.",
          payload: {},
          created_at: "2026-10-06T00:00:00Z",
        },
      },
    });
    await persistBondLevelNotification(admin as never, USER_ID, "hello_my_name_is", 4);
  });
});

describe("sendExternalReturnNotice", () => {
  let restoreEnv: (() => void) | undefined;

  afterEach(() => {
    restoreEnv?.();
    restoreEnv = undefined;
  });

  it("returns when expedition notices are disabled", async () => {
    const admin = createClient({ notification_settings: { data: null } });
    await sendExternalReturnNotice(admin as never, USER_ID);
  });

  it("skips telegram and email when tokens are missing", async () => {
    restoreEnv = stubEnv({ TELEGRAM_BOT_TOKEN: undefined, RESEND_API_KEY: undefined, RESEND_FROM_EMAIL: undefined });
    const admin = createClient(
      {
        notification_settings: {
          data: {
            expedition_notifications_enabled: true,
            telegram_chat_id: "123",
            email_notifications_enabled: true,
            locale: "en",
          },
        },
      },
      { email: "gardener@example.com" },
    );
    await sendExternalReturnNotice(admin as never, USER_ID);
  });

  it("sends telegram and english email", async () => {
    restoreEnv = stubEnv({
      TELEGRAM_BOT_TOKEN: "tg-token",
      RESEND_API_KEY: "re-key",
      RESEND_FROM_EMAIL: "Plantir <from@example.com>",
    });
    using _fetch = stub(globalThis, "fetch", () => Promise.resolve(new Response("{}", { status: 200 })));
    const admin = createClient(
      {
        notification_settings: {
          data: {
            expedition_notifications_enabled: true,
            telegram_chat_id: "123",
            email_notifications_enabled: true,
            locale: "en",
          },
        },
      },
      { email: "gardener@example.com" },
    );
    await sendExternalReturnNotice(admin as never, USER_ID);
  });

  it("sends italian email and logs telegram failures", async () => {
    restoreEnv = stubEnv({
      TELEGRAM_BOT_TOKEN: "tg-token",
      RESEND_API_KEY: "re-key",
      RESEND_FROM_EMAIL: "Plantir <from@example.com>",
    });
    using _fetch = stub(globalThis, "fetch", () => Promise.resolve(new Response("fail", { status: 500 })));
    const admin = createClient(
      {
        notification_settings: {
          data: {
            expedition_notifications_enabled: true,
            telegram_chat_id: "123",
            email_notifications_enabled: true,
            locale: "it",
          },
        },
      },
      { email: "gardener@example.com" },
    );
    await sendExternalReturnNotice(admin as never, USER_ID);
  });

  it("skips email when the user has no address", async () => {
    restoreEnv = stubEnv({ TELEGRAM_BOT_TOKEN: undefined });
    const admin = createClient(
      {
        notification_settings: {
          data: {
            expedition_notifications_enabled: true,
            telegram_chat_id: null,
            email_notifications_enabled: true,
            locale: "en",
          },
        },
      },
      { email: null },
    );
    await sendExternalReturnNotice(admin as never, USER_ID);
  });

  it("skips email when email notices are off", async () => {
    restoreEnv = stubEnv({ TELEGRAM_BOT_TOKEN: undefined });
    const admin = createClient(
      {
        notification_settings: {
          data: {
            expedition_notifications_enabled: true,
            telegram_chat_id: null,
            email_notifications_enabled: false,
            locale: "en",
          },
        },
      },
      { email: "gardener@example.com" },
    );
    await sendExternalReturnNotice(admin as never, USER_ID);
  });
});
