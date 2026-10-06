import "@/test/mocks/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAuthenticatedUser,
  mockInvoke,
  resetSupabaseMocks,
  setupFromMocks,
} from "@/test/mocks/supabase";

vi.mock("@/utils/requireUser", async () => {
  const actual = await vi.importActual<typeof import("@/utils/requireUser")>("@/utils/requireUser");
  return actual;
});

import {
  bootstrapSanctuary,
  cancelExpedition,
  departExpedition,
  fetchSanctuaryState,
  grantCareBonds,
  markIntroCompleted,
  welcomeExpedition,
} from "./expeditionService";

describe("expeditionService", () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockAuthenticatedUser();
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("bootstraps the sanctuary", async () => {
    await bootstrapSanctuary();
    expect(mockInvoke).toHaveBeenCalledWith("garden-expeditions", {
      body: { action: "bootstrap" },
    });
  });

  it("grants care bonds without throwing", async () => {
    mockInvoke.mockResolvedValue({ data: { error: "nope" }, error: null });
    await expect(grantCareBonds()).resolves.toBeUndefined();
  });

  it("departs an expedition", async () => {
    mockInvoke.mockResolvedValue({
      data: { expeditionId: "e1", status: "active", instant: false },
      error: null,
    });
    await expect(departExpedition("moss_lane", "laterToday", ["hello_my_name_is"])).resolves.toEqual({
      expeditionId: "e1",
      status: "active",
      instant: false,
    });
  });

  it("cancels, welcomes, and marks intro", async () => {
    mockInvoke.mockResolvedValue({ data: { storyKey: "moss_lane" }, error: null });
    await cancelExpedition("e1");
    await welcomeExpedition("e1");
    await markIntroCompleted();
    expect(mockInvoke).toHaveBeenCalledTimes(3);
  });

  it("throws when the edge function returns an error object", async () => {
    mockInvoke.mockResolvedValue({ data: { error: "busy" }, error: null });
    await expect(departExpedition("moss_lane", "laterToday", ["hello_my_name_is"])).rejects.toThrow("busy");
  });

  it("throws when the invoke transport fails", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error("network") });
    await expect(bootstrapSanctuary()).rejects.toThrow("network");
  });

  it("grants care bonds on success", async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    await grantCareBonds();
    expect(mockInvoke).toHaveBeenCalledWith("garden-expeditions", {
      body: { action: "grant_care" },
    });
  });

  it("loads sanctuary rows", async () => {
    setupFromMocks({
      user_creature_bonds: { data: [], error: null },
      user_bond_events: { data: [], error: null },
      user_expeditions: { data: [], error: null },
      user_discoveries: { data: [], error: null },
      user_sanctuary: { data: { intro_completed: true, visible_decoration_ids: [], last_celebrated_tier: 1, last_welcomed_expedition_id: null }, error: null },
    });
    const state = await fetchSanctuaryState();
    expect(state.sanctuary?.intro_completed).toBe(true);
    expect(state.bonds).toEqual([]);
  });

  it("defaults missing sanctuary collections", async () => {
    setupFromMocks({
      user_creature_bonds: { data: null, error: null },
      user_bond_events: { data: null, error: null },
      user_expeditions: { data: null, error: null },
      user_discoveries: { data: null, error: null },
      user_sanctuary: { data: null, error: null },
    });
    const state = await fetchSanctuaryState();
    expect(state.bonds).toEqual([]);
    expect(state.events).toEqual([]);
    expect(state.expeditions).toEqual([]);
    expect(state.discoveries).toEqual([]);
    expect(state.sanctuary).toBeNull();
  });

  it.each([
    ["user_creature_bonds", "bonds failed"],
    ["user_bond_events", "events failed"],
    ["user_expeditions", "expeditions failed"],
    ["user_discoveries", "discoveries failed"],
    ["user_sanctuary", "sanctuary failed"],
  ] as const)("throws when %s fails", async (table, message) => {
    setupFromMocks({
      user_creature_bonds: { data: [], error: table === "user_creature_bonds" ? new Error(message) : null },
      user_bond_events: { data: [], error: table === "user_bond_events" ? new Error(message) : null },
      user_expeditions: { data: [], error: table === "user_expeditions" ? new Error(message) : null },
      user_discoveries: { data: [], error: table === "user_discoveries" ? new Error(message) : null },
      user_sanctuary: { data: null, error: table === "user_sanctuary" ? new Error(message) : null },
    });
    await expect(fetchSanctuaryState()).rejects.toThrow(message);
  });
});
