import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  bootstrapSanctuary,
  cancelExpedition,
  completeDue,
  depart,
  markIntro,
  welcomeExpedition,
} from "../../garden-expeditions/sanctuary.ts";
import { createClient, USER_ID } from "./mock_client.ts";

const firstTeam = ["hello_my_name_is"];
const mossTeam = ["hello_my_name_is", "stalking_fern_legally", "matchmaker_of_moisture"];

function unlockRows(keys: string[]) {
  return keys.map((achievement_key) => ({ achievement_key }));
}

describe("bootstrapSanctuary", () => {
  it("creates a sanctuary row and skips care when there are no unlocks", async () => {
    const admin = createClient({
      user_achievements: { data: [] },
      "user_sanctuary:1": { data: null },
      "user_sanctuary:2": { data: null },
    });
    await bootstrapSanctuary(admin as never, USER_ID);
  });

  it("ignores a unique-constraint race when inserting the sanctuary row", async () => {
    const admin = createClient({
      user_achievements: { data: [] },
      "user_sanctuary:1": { data: null },
      "user_sanctuary:2": { data: null, error: { message: "dup", code: "23505" } },
    });
    await bootstrapSanctuary(admin as never, USER_ID);
  });

  it("throws when inserting the sanctuary row fails", async () => {
    const admin = createClient({
      user_achievements: { data: [] },
      "user_sanctuary:1": { data: null },
      "user_sanctuary:2": { data: null, error: { message: "insert failed", code: "400" } },
    });
    await assertRejects(() => bootstrapSanctuary(admin as never, USER_ID));
  });

  it("skips insert when a sanctuary row already exists", async () => {
    const admin = createClient({
      user_achievements: { data: [] },
      user_sanctuary: { data: { user_id: USER_ID } },
    });
    await bootstrapSanctuary(admin as never, USER_ID);
  });
});

describe("depart", () => {
  it("rejects invalid teams and destinations", async () => {
    const admin = createClient({});
    await assertRejects(() => depart(admin as never, USER_ID, "first_outing", "instant", []), Error, "Team must have one to three creatures");
    await assertRejects(
      () => depart(admin as never, USER_ID, "first_outing", "instant", ["a", "a"]),
      Error,
      "Team members must be unique",
    );
    await assertRejects(() => depart(admin as never, USER_ID, "nope", "instant", firstTeam), Error, "Unknown destination");
    await assertRejects(
      () => depart(admin as never, USER_ID, "first_outing", "tomorrow", firstTeam),
      Error,
      "Duration is not available for this route",
    );
  });

  it("rejects locked destinations, locked creatures, and an already-open expedition", async () => {
    const tooFew = createClient({ user_achievements: { data: unlockRows(["hello_my_name_is"]) } });
    await assertRejects(
      () => depart(tooFew as never, USER_ID, "moss_lane", "laterToday", mossTeam),
      Error,
      "Destination is not available yet",
    );

    const lockedMember = createClient({ user_achievements: { data: unlockRows(mossTeam.slice(0, 2).concat(["dirt_whisperer_initiate"])) } });
    await assertRejects(
      () => depart(lockedMember as never, USER_ID, "moss_lane", "laterToday", mossTeam),
      Error,
      "Every team member must be unlocked",
    );

    const busy = createClient({
      user_achievements: { data: unlockRows(firstTeam) },
      user_expeditions: { data: { id: "open" } },
    });
    await assertRejects(
      () => depart(busy as never, USER_ID, "first_outing", "instant", firstTeam),
      Error,
      "An expedition is already in progress",
    );
  });

  it("throws when listing unlocks fails", async () => {
    const admin = createClient({
      user_achievements: { data: null, error: { message: "unlocks down" } },
    });
    await assertRejects(() => depart(admin as never, USER_ID, "first_outing", "instant", firstTeam));
  });

  it("departs an instant first outing and writes a return notice", async () => {
    const admin = createClient({
      user_achievements: { data: unlockRows(firstTeam) },
      "user_expeditions:1": { data: null },
      user_discoveries: { data: [] },
      "user_expeditions:2": { data: [] },
      "user_expeditions:3": { data: { id: "exp-1" } },
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
    assertEquals(await depart(admin as never, USER_ID, "first_outing", "instant", firstTeam), {
      expeditionId: "exp-1",
      status: "ready",
      instant: true,
    });
  });

  it("departs a timed expedition as active", async () => {
    const admin = createClient({
      user_achievements: { data: unlockRows(mossTeam) },
      "user_expeditions:1": { data: null },
      "user_expeditions:2": { data: { id: "exp-2" } },
    });
    assertEquals(await depart(admin as never, USER_ID, "moss_lane", "laterToday", mossTeam), {
      expeditionId: "exp-2",
      status: "active",
      instant: false,
    });
  });

  it("throws when the expedition insert fails", async () => {
    const admin = createClient({
      user_achievements: { data: unlockRows(mossTeam) },
      "user_expeditions:1": { data: null },
      "user_expeditions:2": { data: null, error: { message: "insert failed" } },
    });
    await assertRejects(() => depart(admin as never, USER_ID, "moss_lane", "laterToday", mossTeam));
  });
});

describe("completeDue", () => {
  it("returns zero when nothing is due", async () => {
    const admin = createClient({ user_expeditions: { data: [] } });
    assertEquals(await completeDue(admin as never), { completed: 0 });
  });

  it("throws when listing due expeditions fails", async () => {
    const admin = createClient({
      user_expeditions: { data: null, error: { message: "due down" } },
    });
    await assertRejects(() => completeDue(admin as never));
  });

  it("skips unknown destinations and unclaimed rows", async () => {
    const unknown = createClient({
      user_expeditions: {
        data: [{ id: "x", user_id: USER_ID, destination_id: "ghost", duration_key: "laterToday", team: firstTeam }],
      },
    });
    assertEquals(await completeDue(unknown as never), { completed: 0 });

    const unclaimed = createClient({
      "user_expeditions:1": {
        data: [{ id: "x", user_id: USER_ID, destination_id: "moss_lane", duration_key: "laterToday", team: mossTeam }],
      },
      "user_expeditions:2": { data: null },
    });
    assertEquals(await completeDue(unclaimed as never), { completed: 0 });
  });

  it("throws when the claim update fails", async () => {
    const admin = createClient({
      "user_expeditions:1": {
        data: [{ id: "x", user_id: USER_ID, destination_id: "moss_lane", duration_key: "laterToday", team: mossTeam }],
      },
      "user_expeditions:2": { data: null, error: { message: "claim failed" } },
    });
    await assertRejects(() => completeDue(admin as never));
  });

  it("completes a due expedition and skips external notice when disabled", async () => {
    const admin = createClient({
      "user_expeditions:1": {
        data: [{ id: "x", user_id: USER_ID, destination_id: "moss_lane", duration_key: "laterToday", team: mossTeam }],
      },
      "user_expeditions:2": { data: { id: "x" } },
      user_discoveries: { data: [] },
      "user_expeditions:3": { data: [] },
      "user_expeditions:4": { data: null },
      notifications: { data: null, error: { message: "dup", code: "23505" } },
      notification_settings: { data: { expedition_notifications_enabled: false } },
      "user_expeditions:5": { data: null },
    });
    assertEquals(await completeDue(admin as never), { completed: 1 });
  });

  it("throws when writing the frozen outcome fails", async () => {
    const admin = createClient({
      "user_expeditions:1": {
        data: [{ id: "x", user_id: USER_ID, destination_id: "moss_lane", duration_key: "laterToday", team: mossTeam }],
      },
      "user_expeditions:2": { data: { id: "x" } },
      user_discoveries: { data: [] },
      "user_expeditions:3": { data: [] },
      "user_expeditions:4": { data: null, error: { message: "outcome failed" } },
    });
    await assertRejects(() => completeDue(admin as never));
  });
});

describe("cancelExpedition", () => {
  it("cancels an active expedition", async () => {
    const admin = createClient({ user_expeditions: { data: { id: "e1" } } });
    await cancelExpedition(admin as never, USER_ID, "e1");
  });

  it("throws when nothing is active", async () => {
    const admin = createClient({ user_expeditions: { data: null } });
    await assertRejects(() => cancelExpedition(admin as never, USER_ID, "e1"), Error, "No active expedition to cancel");
  });

  it("throws on update errors", async () => {
    const admin = createClient({ user_expeditions: { data: null, error: { message: "cancel failed" } } });
    await assertRejects(() => cancelExpedition(admin as never, USER_ID, "e1"));
  });
});

describe("welcomeExpedition", () => {
  const readyOutcome = {
    storyKey: "moss_lane",
    extraStoryKey: null,
    discoveryIds: ["moss_lane_map"],
    talentMatches: [],
    observations: [],
    bondGrants: [{ achievementKey: "hello_my_name_is", points: 20 }],
  };

  it("throws when the expedition is not ready", async () => {
    const missing = createClient({ user_expeditions: { data: null } });
    await assertRejects(() => welcomeExpedition(missing as never, USER_ID, "e1"), Error, "Expedition is not ready to welcome");

    const active = createClient({
      user_expeditions: { data: { id: "e1", destination_id: "moss_lane", outcome: readyOutcome, status: "active" } },
    });
    await assertRejects(() => welcomeExpedition(active as never, USER_ID, "e1"), Error, "Expedition is not ready to welcome");
  });

  it("throws when reading the expedition fails", async () => {
    const admin = createClient({ user_expeditions: { data: null, error: { message: "read failed" } } });
    await assertRejects(() => welcomeExpedition(admin as never, USER_ID, "e1"));
  });

  it("applies grants, discoveries, and marks the expedition welcomed", async () => {
    const admin = createClient({
      "user_expeditions:1": {
        data: { id: "e1", destination_id: "moss_lane", outcome: readyOutcome, status: "ready" },
      },
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null },
      notifications: { data: null },
      user_discoveries: { data: null },
      "user_expeditions:2": { data: null },
      user_sanctuary: { data: null },
    });
    assertEquals(await welcomeExpedition(admin as never, USER_ID, "e1"), readyOutcome);
  });

  it("skips discovery upserts when none were found", async () => {
    const outcome = { ...readyOutcome, discoveryIds: [] };
    const admin = createClient({
      "user_expeditions:1": {
        data: { id: "e1", destination_id: "first_outing", outcome, status: "ready" },
      },
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null },
      notifications: { data: null },
      "user_expeditions:2": { data: null },
      user_sanctuary: { data: null },
    });
    assertEquals(await welcomeExpedition(admin as never, USER_ID, "e1"), outcome);
  });

  it("throws when discovery upsert fails", async () => {
    const admin = createClient({
      "user_expeditions:1": {
        data: { id: "e1", destination_id: "moss_lane", outcome: readyOutcome, status: "ready" },
      },
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null },
      notifications: { data: null },
      user_discoveries: { data: null, error: { message: "discovery failed" } },
    });
    await assertRejects(() => welcomeExpedition(admin as never, USER_ID, "e1"));
  });

  it("throws when the welcome update fails", async () => {
    const outcome = { ...readyOutcome, discoveryIds: [] };
    const admin = createClient({
      "user_expeditions:1": {
        data: { id: "e1", destination_id: "moss_lane", outcome, status: "ready" },
      },
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null },
      notifications: { data: null },
      "user_expeditions:2": { data: null, error: { message: "welcome failed" } },
    });
    await assertRejects(() => welcomeExpedition(admin as never, USER_ID, "e1"));
  });
});

describe("markIntro", () => {
  it("upserts the intro flag", async () => {
    const admin = createClient({ user_sanctuary: { data: null } });
    await markIntro(admin as never, USER_ID, true);
    await markIntro(admin as never, USER_ID, false);
  });
});
