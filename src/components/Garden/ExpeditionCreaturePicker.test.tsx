import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import ExpeditionCreaturePicker from "./ExpeditionCreaturePicker";
import { EXPEDITION_DESTINATIONS } from "@/constants/expeditions";
import type { AchievementKey } from "@/constants/achievements";
import type { EarnedAchievement } from "@/services/achievementService";

vi.mock("./GardenSprites", () => ({
  GardenSprite: () => <span data-testid="sprite" />,
}));

function earnedOf(key: AchievementKey, element: EarnedAchievement["garden_element"]): EarnedAchievement {
  return {
    key,
    name: key,
    description: key,
    garden_element: element,
    sort_order: 1,
    is_hidden: false,
    unlocked_at: "2026-09-24T00:00:00Z",
  };
}

const brin = earnedOf("hello_my_name_is", "sprout");
const morel = earnedOf("stalking_fern_legally", "sensor_mushroom");
const rill = earnedOf("hydration_hero", "watering_can");
const moss = EXPEDITION_DESTINATIONS.find((item) => item.id === "moss_lane")!;

describe("ExpeditionCreaturePicker", () => {
  it("toggles a companion and keeps selected creatures visible during search", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ExpeditionCreaturePicker
        earned={[brin, morel]}
        destination={moss}
        team={["hello_my_name_is"]}
        visitedByCreature={new Map()}
        onToggle={onToggle}
      />,
    );
    expect(screen.getByRole("button", { name: /Brin/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Morel/ }));
    expect(onToggle).toHaveBeenCalledWith("stalking_fern_legally");

    await user.type(screen.getByRole("textbox", { name: "Search companions" }), "zzzz");
    expect(screen.getByRole("button", { name: /Brin/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Morel/ })).not.toBeInTheDocument();
  });

  it("filters helpful and first-visit companions", async () => {
    const user = userEvent.setup();
    const visited = new Map<AchievementKey, Set<string>>([
      ["hello_my_name_is", new Set(["moss_lane"])],
    ]);
    renderWithProviders(
      <ExpeditionCreaturePicker
        earned={[brin, morel, rill]}
        destination={moss}
        team={[]}
        visitedByCreature={visited}
        onToggle={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Helpful here" }));
    expect(screen.getByRole("button", { name: /Morel/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Brin/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New here" }));
    expect(screen.getByRole("button", { name: /Morel/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Brin/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("First visit").length).toBeGreaterThan(0);
    expect(screen.getByText("Helpful")).toBeInTheDocument();
  });

  it("does not toggle when the team is full", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ExpeditionCreaturePicker
        earned={[brin, morel, rill, earnedOf("cloud_oracle", "rain_cloud")]}
        destination={moss}
        team={["hello_my_name_is", "stalking_fern_legally", "hydration_hero"]}
        visitedByCreature={new Map()}
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Nimbus/ }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("shows empty copy when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ExpeditionCreaturePicker
        earned={[brin]}
        destination={moss}
        team={[]}
        visitedByCreature={new Map()}
        onToggle={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox", { name: "Search companions" }), "zzzz");
    expect(screen.getByText("No companions match that search.")).toBeInTheDocument();
  });
});
