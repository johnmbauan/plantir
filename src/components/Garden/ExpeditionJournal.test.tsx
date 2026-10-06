import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import ExpeditionJournal from "./ExpeditionJournal";
import type { UserExpedition } from "@/services/expeditionService";

const welcomedFirst: UserExpedition = {
  id: "e1",
  destination_id: "first_outing",
  duration_key: "instant",
  team: ["hello_my_name_is"],
  started_at: "2026-09-24T00:00:00Z",
  returns_at: "2026-09-24T00:00:00Z",
  status: "welcomed",
  outcome: null,
};

const welcomedMoss: UserExpedition = {
  ...welcomedFirst,
  id: "e2",
  destination_id: "moss_lane",
  duration_key: "laterToday",
};

describe("ExpeditionJournal", () => {
  it("shows empty copy when nothing is recorded", () => {
    renderWithProviders(<ExpeditionJournal expeditions={[]} discoveries={[]} onClose={vi.fn()} />);
    expect(screen.getAllByText("Journeys and discoveries will collect here.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nearby trails").length).toBeGreaterThan(0);
  });

  it("lists complete, hinted, and family destinations", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ExpeditionJournal
        expeditions={[welcomedFirst, welcomedMoss]}
        discoveries={[
          { discovery_id: "first_outing_journal", expedition_id: "e1", unlocked_at: "2026-09-24T00:00:00Z" },
          { discovery_id: "first_outing_pebble", expedition_id: "e1", unlocked_at: "2026-09-24T00:00:00Z" },
        ]}
        onClose={onClose}
      />,
    );
    expect(screen.getAllByText("Sanctuary path").length).toBeGreaterThan(0);
    expect(screen.getByText("Main discoveries found")).toBeInTheDocument();
    expect(screen.getByText("There is still something waiting on this trail.")).toBeInTheDocument();
    expect(screen.getByText("Plant-life routes")).toBeInTheDocument();
    expect(screen.getByText("First journal page")).toBeInTheDocument();
    expect(screen.getByText("Warm pebble")).toBeInTheDocument();
    expect(screen.getAllByText(/Brin/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
