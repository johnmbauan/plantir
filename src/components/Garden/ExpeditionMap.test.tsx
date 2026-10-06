import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import ExpeditionMap from "./ExpeditionMap";
import type { EarnedAchievement } from "@/services/achievementService";
import type { AchievementKey } from "@/constants/achievements";

function earnedOf(key: AchievementKey, name: string, element: EarnedAchievement["garden_element"]): EarnedAchievement {
  return {
    key,
    name,
    description: name,
    garden_element: element,
    sort_order: 1,
    is_hidden: false,
    unlocked_at: "2026-09-24T00:00:00Z",
  };
}

const first = earnedOf("hello_my_name_is", "First Plant", "sprout");
const morel = earnedOf("stalking_fern_legally", "First Sensor", "sensor_mushroom");
const liana = earnedOf("matchmaker_of_moisture", "Sensor Linked", "vine_link");
const peek = earnedOf("dirt_whisperer_initiate", "Sensor Calibrated", "magnifier");

describe("ExpeditionMap", () => {
  it("sends a team on the first outing", async () => {
    const onDepart = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <ExpeditionMap earned={[first]} expeditions={[]} onDepart={onDepart} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Unlock more creatures to open longer trails.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Brin/ }));
    await user.click(screen.getByRole("button", { name: "Send them out" }));
    expect(onDepart).toHaveBeenCalledWith("first_outing", "instant", ["hello_my_name_is"]);
  });

  it("selects a shared destination, duration, and a team of three", async () => {
    const onDepart = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ExpeditionMap
        earned={[first, morel, liana, peek]}
        expeditions={[{
          id: "old",
          destination_id: "moss_lane",
          duration_key: "laterToday",
          team: ["hello_my_name_is"],
          started_at: "2026-09-24T00:00:00Z",
          returns_at: "2026-09-24T08:00:00Z",
          status: "welcomed",
          outcome: null,
        }, {
          id: "cancelled",
          destination_id: "seed_hollow",
          duration_key: "laterToday",
          team: ["hello_my_name_is"],
          started_at: "2026-09-24T00:00:00Z",
          returns_at: "2026-09-24T08:00:00Z",
          status: "cancelled",
          outcome: null,
        }]}
        onDepart={onDepart}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Moss Lane" }));
    await user.click(screen.getByRole("button", { name: "Tomorrow" }));
    await user.click(screen.getByRole("button", { name: /Brin/ }));
    await user.click(screen.getByRole("button", { name: /Morel/ }));
    await user.click(screen.getByRole("button", { name: /Liana/ }));
    await user.click(screen.getByRole("button", { name: /Peek/ }));
    await user.click(screen.getByRole("button", { name: /Brin/ }));
    await user.click(screen.getByRole("button", { name: /Peek/ }));
    await user.click(screen.getByRole("button", { name: "Send them out" }));
    expect(onDepart).toHaveBeenCalledWith("moss_lane", "tomorrow", [
      "stalking_fern_legally",
      "matchmaker_of_moisture",
      "dirt_whisperer_initiate",
    ]);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
