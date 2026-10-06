import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import i18n from "@/i18n";
import GardenMissionBar from "./GardenMissionBar";
import { formatReturnLabel } from "./formatReturnLabel";
import type { EarnedAchievement } from "@/services/achievementService";
import type { UserExpedition } from "@/services/expeditionService";

vi.mock("./GardenSprites", () => ({
  GardenSprite: () => <span data-testid="sprite" />,
}));

const sprout: EarnedAchievement = {
  key: "hello_my_name_is",
  name: "First Plant",
  description: "Create your first plant.",
  garden_element: "sprout",
  sort_order: 1,
  is_hidden: false,
  unlocked_at: "2026-09-24T00:00:00Z",
};

const expedition: UserExpedition = {
  id: "e1",
  destination_id: "moss_lane",
  duration_key: "laterToday",
  team: ["hello_my_name_is", "hydration_hero"],
  started_at: "2026-10-06T08:00:00.000Z",
  returns_at: "2026-10-06T16:00:00.000Z",
  status: "active",
  outcome: null,
};

function t(key: string, options?: Record<string, string>): string {
  if (key === "garden.returnsToday") return `Back today at ${options?.time}`;
  if (key === "garden.returnsTomorrow") return `Back tomorrow at ${options?.time}`;
  if (key === "garden.returnsAt") return `Back by ${options?.time}`;
  return key;
}

describe("formatReturnLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses today copy for a return later today", () => {
    const iso = "2026-10-06T16:00:00.000Z";
    const time = new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    expect(formatReturnLabel(iso, "en-US", t)).toBe(`Back today at ${time}`);
  });

  it("uses tomorrow copy for a return the next calendar day", () => {
    const iso = "2026-10-07T09:00:00.000Z";
    const time = new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    expect(formatReturnLabel(iso, "en-US", t)).toBe(`Back tomorrow at ${time}`);
  });

  it("uses a dated label for later days", () => {
    const iso = "2026-10-09T09:00:00.000Z";
    const stamp = new Date(iso).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(formatReturnLabel(iso, "en-US", t)).toBe(`Back by ${stamp}`);
  });
});

describe("GardenMissionBar", () => {
  it("shows destination, team names, and help", async () => {
    const onOpenHelp = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GardenMissionBar
        expedition={expedition}
        earned={[sprout]}
        cancelOpen={false}
        onAskCancel={vi.fn()}
        onConfirmCancel={vi.fn()}
        onKeepGoing={vi.fn()}
        onOpenHelp={onOpenHelp}
      />,
    );
    expect(screen.getByText("Expedition in progress")).toBeInTheDocument();
    expect(screen.getByText("Moss Lane")).toBeInTheDocument();
    expect(screen.getByText("Brin")).toBeInTheDocument();
    expect(screen.getByText("Rill")).toBeInTheDocument();
    expect(screen.getByTestId("sprite")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "How expeditions work" }));
    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });

  it("asks to call the team back", async () => {
    const onAskCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GardenMissionBar
        expedition={expedition}
        earned={[sprout]}
        cancelOpen={false}
        onAskCancel={onAskCancel}
        onConfirmCancel={vi.fn()}
        onKeepGoing={vi.fn()}
        onOpenHelp={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    expect(onAskCancel).toHaveBeenCalledTimes(1);
  });

  it("confirms or keeps going from the cancel prompt", async () => {
    const onConfirmCancel = vi.fn();
    const onKeepGoing = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <GardenMissionBar
        expedition={expedition}
        earned={[sprout]}
        cancelOpen
        onAskCancel={vi.fn()}
        onConfirmCancel={onConfirmCancel}
        onKeepGoing={onKeepGoing}
        onOpenHelp={vi.fn()}
      />,
    );
    expect(screen.getByText("They will return safely. There will be no discovery or bond progress.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Let them continue" }));
    expect(onKeepGoing).toHaveBeenCalledTimes(1);

    rerender(
      <GardenMissionBar
        expedition={expedition}
        earned={[sprout]}
        cancelOpen
        onAskCancel={vi.fn()}
        onConfirmCancel={onConfirmCancel}
        onKeepGoing={onKeepGoing}
        onOpenHelp={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Call them back" }));
    expect(onConfirmCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm action while busy", () => {
    renderWithProviders(
      <GardenMissionBar
        expedition={expedition}
        earned={[sprout]}
        cancelOpen
        busy
        onAskCancel={vi.fn()}
        onConfirmCancel={vi.fn()}
        onKeepGoing={vi.fn()}
        onOpenHelp={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Call them back" })).toBeDisabled();
  });

  it("formats return times with the Italian locale", async () => {
    await i18n.changeLanguage("it");
    try {
      renderWithProviders(
        <GardenMissionBar
          expedition={expedition}
          earned={[sprout]}
          cancelOpen={false}
          onAskCancel={vi.fn()}
          onConfirmCancel={vi.fn()}
          onKeepGoing={vi.fn()}
          onOpenHelp={vi.fn()}
        />,
      );
      expect(screen.getByText("Vicolo del muschio")).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage("en");
    }
  });
});
