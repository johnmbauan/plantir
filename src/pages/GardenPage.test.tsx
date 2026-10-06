import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import { GARDEN_TIERS } from "@/constants/achievements";
import type { EarnedAchievement } from "@/services/achievementService";

const refresh = vi.fn();
const departExpedition = vi.fn();
const welcomeExpedition = vi.fn();
const cancelExpedition = vi.fn();
const markIntroCompleted = vi.fn();
const notificationsShow = vi.fn();

const sprout: EarnedAchievement = {
  key: "hello_my_name_is",
  name: "First Plant",
  description: "Create your first plant.",
  garden_element: "sprout",
  sort_order: 1,
  is_hidden: false,
  unlocked_at: "2026-09-24T00:00:00Z",
};

let sanctuaryState: {
  bonds: { achievement_key: string; bond_points: number; bond_level: number; updated_at: string }[];
  openExpedition: null | {
    id: string;
    destination_id: string;
    duration_key: string;
    team: string[];
    started_at: string;
    returns_at: string;
    status: string;
    outcome: null | {
      storyKey: string;
      extraStoryKey: string | null;
      discoveryIds: string[];
      talentMatches: string[];
      observations: [];
      bondGrants: [];
    };
  };
  travelingKeys: string[];
  introCompleted: boolean;
};

vi.mock("@/components/Garden/useGardenState", () => ({
  useGardenState: () => ({
    loading: false,
    allDefinitions: [sprout],
    earned: [sprout],
    earnedCount: 1,
    tier: GARDEN_TIERS[1],
    newlyUnlockedKeys: [],
    refresh,
  }),
}));

vi.mock("@/components/Garden/useSanctuaryState", () => ({
  useSanctuaryState: () => ({
    loading: false,
    state: {
      bonds: sanctuaryState.bonds,
      events: [],
      expeditions: sanctuaryState.openExpedition ? [sanctuaryState.openExpedition] : [],
      discoveries: [],
      sanctuary: {
        intro_completed: sanctuaryState.introCompleted,
        visible_decoration_ids: [],
        last_celebrated_tier: 0,
        last_welcomed_expedition_id: null,
      },
    },
    refresh,
    openExpedition: sanctuaryState.openExpedition,
    travelingKeys: sanctuaryState.travelingKeys,
  }),
  expeditionsForCreature: () => [],
}));

vi.mock("@/components/Garden/GardenSection", () => ({
  default: ({ onSelectCreature }: { onSelectCreature?: (key: string) => void }) => (
    <>
      <button type="button" onClick={() => onSelectCreature?.("hello_my_name_is")}>
        Open creature
      </button>
      <button type="button" onClick={() => onSelectCreature?.("midnight_mulcher")}>
        Open locked
      </button>
    </>
  ),
}));

vi.mock("@/services/expeditionService", () => ({
  departExpedition: (...args: unknown[]) => departExpedition(...args),
  welcomeExpedition: (...args: unknown[]) => welcomeExpedition(...args),
  cancelExpedition: (...args: unknown[]) => cancelExpedition(...args),
  markIntroCompleted: (...args: unknown[]) => markIntroCompleted(...args),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: (...args: unknown[]) => notificationsShow(...args) },
}));

import GardenPage from "./GardenPage";

function readyOuting() {
  return {
    id: "e1",
    destination_id: "first_outing",
    duration_key: "instant",
    team: ["hello_my_name_is"],
    started_at: "2026-09-24T00:00:00Z",
    returns_at: "2026-09-24T00:00:00Z",
    status: "ready",
    outcome: {
      storyKey: "first_outing",
      extraStoryKey: null,
      discoveryIds: [],
      talentMatches: [],
      observations: [] as [],
      bondGrants: [] as [],
    },
  };
}

function activeOuting() {
  return {
    id: "e2",
    destination_id: "moss_lane",
    duration_key: "laterToday",
    team: ["hello_my_name_is"],
    started_at: "2026-09-24T00:00:00Z",
    returns_at: "2026-09-24T08:00:00Z",
    status: "active",
    outcome: null,
  };
}

describe("GardenPage", () => {
  beforeEach(() => {
    refresh.mockReset().mockResolvedValue(undefined);
    departExpedition.mockReset().mockResolvedValue({ expeditionId: "e1", status: "ready", instant: true });
    welcomeExpedition.mockReset().mockResolvedValue({});
    cancelExpedition.mockReset().mockResolvedValue(undefined);
    markIntroCompleted.mockReset().mockResolvedValue(undefined);
    notificationsShow.mockReset();
    sanctuaryState = {
      bonds: [{ achievement_key: "hello_my_name_is", bond_points: 0, bond_level: 1, updated_at: "2026-09-24T00:00:00Z" }],
      openExpedition: null,
      travelingKeys: [],
      introCompleted: true,
    };
  });

  it("renders the garden title and expedition actions", () => {
    renderWithProviders(<GardenPage />);
    expect(screen.getByRole("heading", { name: "Your Garden" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Journal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send an expedition" })).toBeEnabled();
  });

  it("opens the journal and map, then sends the first outing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Journal" }));
    expect(screen.getByText("Expedition journal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Send an expedition" }));
    expect(screen.getByText("Every expedition succeeds. Team talents change the story, not the outcome.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Brin/ }));
    await user.click(screen.getByRole("button", { name: "Send them out" }));
    await waitFor(() => {
      expect(departExpedition).toHaveBeenCalledWith("first_outing", "instant", ["hello_my_name_is"]);
    });
  });

  it("shows a depart error", async () => {
    departExpedition.mockRejectedValue(new Error("busy"));
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Send an expedition" }));
    await user.click(screen.getByRole("button", { name: /Brin/ }));
    await user.click(screen.getByRole("button", { name: "Send them out" }));
    await waitFor(() => {
      expect(notificationsShow).toHaveBeenCalledWith(expect.objectContaining({ message: "busy" }));
    });
  });

  it("opens a creature profile from the sanctuary", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Open creature" }));
    expect(screen.getByText("Brin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Eager, gentle, and always first to look around a corner.")).not.toBeInTheDocument();
  });

  it("ignores a locked creature and opens a profile without a bond row", async () => {
    sanctuaryState.bonds = [];
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Open locked" }));
    expect(screen.queryByText("Umbra")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open creature" }));
    expect(screen.getByText("Brin")).toBeInTheDocument();
    expect(screen.getByText(/New Arrival/)).toBeInTheDocument();
  });

  it("does not open a profile for a travelling creature", async () => {
    sanctuaryState.travelingKeys = ["hello_my_name_is"];
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Open creature" }));
    expect(screen.queryByText("Eager, gentle, and always first to look around a corner.")).not.toBeInTheDocument();
  });

  it("welcomes a ready expedition", async () => {
    sanctuaryState.openExpedition = readyOuting();
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Welcome them home" }));
    expect(welcomeExpedition).toHaveBeenCalledWith("e1");
  });

  it("shows a welcome error", async () => {
    sanctuaryState.openExpedition = readyOuting();
    welcomeExpedition.mockRejectedValue(new Error("welcome failed"));
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => {
      expect(notificationsShow).toHaveBeenCalledWith(expect.objectContaining({ message: "welcome failed" }));
    });
  });

  it("cancels an active expedition", async () => {
    sanctuaryState.openExpedition = activeOuting();
    sanctuaryState.travelingKeys = ["hello_my_name_is"];
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    expect(screen.getByText("They will return safely. There will be no discovery or bond progress.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    expect(cancelExpedition).toHaveBeenCalledWith("e2");
  });

  it("keeps an expedition going from the cancel dialog", async () => {
    sanctuaryState.openExpedition = activeOuting();
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    expect(screen.getByText("They will return safely. There will be no discovery or bond progress.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Let them continue" }));
    expect(cancelExpedition).not.toHaveBeenCalled();
  });

  it("shows a cancel error", async () => {
    sanctuaryState.openExpedition = activeOuting();
    cancelExpedition.mockRejectedValue(new Error("cancel failed"));
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    await waitFor(() => {
      expect(notificationsShow).toHaveBeenCalledWith(expect.objectContaining({ message: "cancel failed" }));
    });
  });

  it("runs the first-creature introduction", async () => {
    sanctuaryState.introCompleted = false;
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(markIntroCompleted).toHaveBeenCalled();
    expect(departExpedition).not.toHaveBeenCalled();
  });

  it("starts the first outing from the introduction", async () => {
    sanctuaryState.introCompleted = false;
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Send the first expedition" }));
    await waitFor(() => {
      expect(markIntroCompleted).toHaveBeenCalled();
      expect(departExpedition).toHaveBeenCalledWith("first_outing", "instant", ["hello_my_name_is"]);
    });
  });

  it("replays help without starting a mission", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Send an expedition" }));
    await user.click(screen.getByRole("button", { name: "How expeditions work" }));
    expect(screen.getByText("Send a team")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(departExpedition).not.toHaveBeenCalled();
    expect(screen.queryByText("Send a team")).not.toBeInTheDocument();
  });

  it("can open help while another expedition is open", async () => {
    sanctuaryState.openExpedition = activeOuting();
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "How expeditions work" }));
    expect(screen.getByText("Send a team")).toBeInTheDocument();
    expect(departExpedition).not.toHaveBeenCalled();
  });

  it("closes help without departing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GardenPage />);
    await user.click(screen.getByRole("button", { name: "Send an expedition" }));
    await user.click(screen.getByRole("button", { name: "How expeditions work" }));
    expect(screen.getByText("Send a team")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(departExpedition).not.toHaveBeenCalled();
    expect(screen.queryByText("Send a team")).not.toBeInTheDocument();
  });
});
