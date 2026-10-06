import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import ReturnSequence from "./ReturnSequence";
import type { UserExpedition } from "@/services/expeditionService";

const expedition: UserExpedition = {
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
    discoveryIds: ["first_outing_pebble"],
    talentMatches: ["curiosity"],
    observations: [{ achievementKey: "hello_my_name_is", firstVisit: true }],
    bondGrants: [{ achievementKey: "hello_my_name_is", points: 20 }],
  },
};

describe("ReturnSequence", () => {
  it("welcomes the team", async () => {
    const onWelcome = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ReturnSequence expedition={expedition} onWelcome={onWelcome} />);
    expect(screen.getByText("Your explorers returned with something unusual.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Welcome them home" }));
    expect(onWelcome).toHaveBeenCalled();
  });

  it("renders an extra story when the team added a scene", () => {
    renderWithProviders(
      <ReturnSequence
        expedition={{
          ...expedition,
          outcome: {
            ...expedition.outcome!,
            extraStoryKey: "moss_lane_observation",
            discoveryIds: ["first_outing_pebble", "moss_lane_dew"],
          },
        }}
        onWelcome={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText("Someone noticed a second path under the first, written in dew.")).toBeInTheDocument();
    expect(screen.getByText("Dew path note")).toBeInTheDocument();
  });

  it("skips without losing the welcome", async () => {
    const onWelcome = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ReturnSequence expedition={expedition} onWelcome={onWelcome} />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onWelcome).toHaveBeenCalled();
  });
});
