import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { applyBondGrants, ensureBondsForUnlocks } from "../../garden-expeditions/bonds.ts";
import { careGrant, createClient, USER_ID } from "./mock_client.ts";

describe("applyBondGrants", () => {
  it("returns when every grant has no points", async () => {
    const admin = createClient({});
    await applyBondGrants(admin as never, USER_ID, [careGrant({ points: 0 })]);
  });

  it("returns when the grants were already recorded", async () => {
    const admin = createClient({
      user_bond_events: {
        data: [{ achievement_key: "hello_my_name_is", reason_code: "care_plant", subject_id: "p1" }],
      },
    });
    await applyBondGrants(admin as never, USER_ID, [careGrant()]);
  });

  it("throws when listing existing events fails", async () => {
    const admin = createClient({
      user_bond_events: { data: null, error: { message: "events down" } },
    });
    await assertRejects(() => applyBondGrants(admin as never, USER_ID, [careGrant()]));
  });

  it("ignores unique-constraint races on insert", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null, error: { message: "dup", code: "23505" } },
    });
    await applyBondGrants(admin as never, USER_ID, [careGrant()]);
  });

  it("throws on other insert errors", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null, error: { message: "insert failed", code: "400" } },
    });
    await assertRejects(() => applyBondGrants(admin as never, USER_ID, [careGrant()]));
  });

  it("throws when reading bonds fails", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      user_creature_bonds: { data: null, error: { message: "bonds down" } },
    });
    await assertRejects(() => applyBondGrants(admin as never, USER_ID, [careGrant()]));
  });

  it("throws when upserting bonds fails", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null, error: { message: "upsert failed" } },
    });
    await assertRejects(() => applyBondGrants(admin as never, USER_ID, [careGrant()]));
  });

  it("upserts points and notifies when the level increases", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": {
        data: [{ achievement_key: "hello_my_name_is", bond_points: 12, bond_level: 1 }],
      },
      "user_creature_bonds:2": { data: null },
      notifications: {
        data: { id: "n1", type: "bond_level", title: "Bond grew", body: "A new memory is waiting in their profile.", payload: {}, created_at: "2026-10-06T00:00:00Z" },
      },
    });
    await applyBondGrants(
      admin as never,
      USER_ID,
      [careGrant({ points: 20 })],
      true,
    );
  });

  it("does not notify when the level stays the same", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": {
        data: [{ achievement_key: "hello_my_name_is", bond_points: 0, bond_level: 1 }],
      },
      "user_creature_bonds:2": { data: null },
    });
    await applyBondGrants(admin as never, USER_ID, [careGrant({ points: 8 })], true);
  });

  it("defaults subjectId to once when it is omitted", async () => {
    const admin = createClient({
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null },
    });
    const grant = careGrant();
    delete grant.subjectId;
    await applyBondGrants(admin as never, USER_ID, [grant]);
  });
});

describe("ensureBondsForUnlocks", () => {
  it("returns zeros when the user has no unlocks", async () => {
    const admin = createClient({ user_achievements: { data: [] } });
    assertEquals(await ensureBondsForUnlocks(admin as never, USER_ID), {
      created: 0,
      existingUnlocks: 0,
    });
  });

  it("creates missing bond rows", async () => {
    const admin = createClient({
      user_achievements: { data: [{ achievement_key: "hello_my_name_is" }, { achievement_key: "hydration_hero" }] },
      "user_creature_bonds:1": { data: [{ achievement_key: "hello_my_name_is" }] },
      "user_creature_bonds:2": { data: null },
    });
    assertEquals(await ensureBondsForUnlocks(admin as never, USER_ID), {
      created: 1,
      existingUnlocks: 2,
    });
  });

  it("ignores unique-constraint races when inserting bonds", async () => {
    const admin = createClient({
      user_achievements: { data: [{ achievement_key: "hello_my_name_is" }] },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null, error: { message: "dup", code: "23505" } },
    });
    assertEquals(await ensureBondsForUnlocks(admin as never, USER_ID), {
      created: 1,
      existingUnlocks: 1,
    });
  });

  it("throws when listing unlocks fails", async () => {
    const admin = createClient({
      user_achievements: { data: null, error: { message: "unlocks down" } },
    });
    await assertRejects(() => ensureBondsForUnlocks(admin as never, USER_ID));
  });

  it("throws when inserting bonds fails for a reason other than uniqueness", async () => {
    const admin = createClient({
      user_achievements: { data: [{ achievement_key: "hello_my_name_is" }] },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null, error: { message: "insert failed", code: "400" } },
    });
    await assertRejects(() => ensureBondsForUnlocks(admin as never, USER_ID));
  });
});
