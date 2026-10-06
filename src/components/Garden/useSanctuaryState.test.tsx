import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expeditionsForCreature, useSanctuaryState } from "./useSanctuaryState";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/services/notificationService";
import type { UserExpedition } from "@/services/expeditionService";

const bootstrapSanctuary = vi.fn();
const fetchSanctuaryState = vi.fn();

vi.mock("@/services/expeditionService", () => ({
  bootstrapSanctuary: (...args: unknown[]) => bootstrapSanctuary(...args),
  fetchSanctuaryState: (...args: unknown[]) => fetchSanctuaryState(...args),
}));

const active: UserExpedition = {
  id: "e1",
  destination_id: "moss_lane",
  duration_key: "laterToday",
  team: ["hello_my_name_is"],
  started_at: "2026-09-24T00:00:00Z",
  returns_at: "2026-09-24T08:00:00Z",
  status: "active",
  outcome: null,
};

const ready: UserExpedition = {
  ...active,
  id: "e2",
  status: "ready",
};

const emptyState = {
  bonds: [],
  events: [],
  expeditions: [] as UserExpedition[],
  discoveries: [],
  sanctuary: { intro_completed: true, visible_decoration_ids: [], last_celebrated_tier: 0, last_welcomed_expedition_id: null },
};

describe("useSanctuaryState", () => {
  beforeEach(() => {
    bootstrapSanctuary.mockReset().mockResolvedValue(undefined);
    fetchSanctuaryState.mockReset().mockResolvedValue({
      ...emptyState,
      expeditions: [active],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads sanctuary state and exposes travelling creatures", async () => {
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.travelingKeys).toEqual(["hello_my_name_is"]);
    expect(result.current.openExpedition?.id).toBe("e1");
  });

  it("treats a ready expedition as open but not travelling", async () => {
    fetchSanctuaryState.mockResolvedValue({ ...emptyState, expeditions: [ready] });
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => {
      expect(result.current.openExpedition?.id).toBe("e2");
    });
    expect(result.current.travelingKeys).toEqual([]);
  });

  it("logs when bootstrap fails and stops loading", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    bootstrapSanctuary.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("refetches when a garden notification arrives", async () => {
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    fetchSanctuaryState.mockResolvedValue({ ...emptyState, expeditions: [ready] });
    act(() => {
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    });
    await waitFor(() => {
      expect(result.current.openExpedition?.status).toBe("ready");
    });
  });

  it("logs when a notification refetch fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    fetchSanctuaryState.mockRejectedValue(new Error("stale"));
    act(() => {
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    spy.mockRestore();
  });

  it("logs when the active-expedition poll fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    fetchSanctuaryState.mockRejectedValue(new Error("poll failed"));
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    spy.mockRestore();
  });

  it("polls while an expedition is active", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = renderHook(() => useSanctuaryState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSanctuaryState).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(fetchSanctuaryState).toHaveBeenCalledTimes(2);
  });
});

describe("expeditionsForCreature", () => {
  it("returns welcomed expeditions that included the creature", () => {
    const welcomed = { ...active, status: "welcomed" as const };
    expect(expeditionsForCreature([welcomed], "hello_my_name_is")).toEqual([welcomed]);
    expect(expeditionsForCreature([active], "hello_my_name_is")).toEqual([]);
  });
});
