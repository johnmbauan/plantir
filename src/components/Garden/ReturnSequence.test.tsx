import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import ReturnSequence from "./ReturnSequence";
import type { UserExpedition } from "@/services/expeditionService";

const expedition: UserExpedition = {
  id: "e1",
  destination_id: "first_outing",
  duration_key: "instant",
  team: ["hello_my_name_is", "stalking_fern_legally", "matchmaker_of_moisture"],
  started_at: "2026-09-24T00:00:00Z",
  returns_at: "2026-09-24T00:00:00Z",
  status: "ready",
  outcome: {
    chapterKey: "first_outing_ch1",
    extraChapterKey: null,
    hookKey: "first_outing_hook1",
    cast: {
      lead: "hello_my_name_is",
      scout: "stalking_fern_legally",
      anchor: "matchmaker_of_moisture",
    },
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
            extraChapterKey: "first_outing_ch2",
            discoveryIds: ["first_outing_pebble", "first_outing_journal"],
          },
        }}
        onWelcome={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(
      screen.getByText("The garden gate stood open, and the pots were only a few steps behind. Brin had not finished the sentence about going only as far as the first corner, and Morel was already on the other side, one foot on the path. Liana kept turning around. Not toward the path: toward the pots, as if they might decide to leave on their own."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("On the right-hand post of the gate, about as high as their hands, sat a small grey pebble. It was not wedged in. It lay flat, and it was warm, as if whoever had put it there had only just taken their fingers away."),
    ).toBeInTheDocument();
    expect(screen.getByText("First journal page")).toBeInTheDocument();
  });

  it("skips without losing the welcome", async () => {
    const onWelcome = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<ReturnSequence expedition={expedition} onWelcome={onWelcome} />);
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onWelcome).toHaveBeenCalled();
  });
});
