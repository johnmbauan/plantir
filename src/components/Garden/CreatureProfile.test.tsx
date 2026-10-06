import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import CreatureProfile from "./CreatureProfile";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";
import type { UserExpedition } from "@/services/expeditionService";

const definition: AchievementDefinition = {
  key: "hello_my_name_is",
  name: "First Plant",
  description: "Create your first plant.",
  garden_element: "sprout",
  sort_order: 1,
  is_hidden: false,
};

const rillDefinition: AchievementDefinition = {
  key: "hydration_hero",
  name: "Watered in Time",
  description: "Water a plant within 48 hours of a watering alert.",
  garden_element: "watering_can",
  sort_order: 7,
  is_hidden: false,
};

const earned: EarnedAchievement = { ...definition, unlocked_at: "2026-09-24T00:00:00Z" };
const rillEarned: EarnedAchievement = { ...rillDefinition, unlocked_at: "2026-09-24T00:00:00Z" };

const welcomed: UserExpedition = {
  id: "e1",
  destination_id: "first_outing",
  duration_key: "instant",
  team: ["hello_my_name_is"],
  started_at: "2026-09-24T00:00:00Z",
  returns_at: "2026-09-24T00:00:00Z",
  status: "welcomed",
  outcome: null,
};

describe("CreatureProfile", () => {
  it("shows bond, origin, and close", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <CreatureProfile
        creatureKey="hello_my_name_is"
        definition={definition}
        earned={earned}
        bond={{ achievement_key: "hello_my_name_is", bond_points: 25, bond_level: 2, updated_at: "2026-09-24T00:00:00Z" }}
        events={[{
          id: "ev1",
          achievement_key: "hello_my_name_is",
          source: "expedition",
          points: 20,
          reason_code: "expedition",
          subject_id: "first_outing",
          created_at: "2026-09-24T00:00:00Z",
        }]}
        discoveries={[]}
        history={[]}
        onClose={onClose}
      />,
    );
    expect(screen.getByText("Brin")).toBeInTheDocument();
    expect(screen.getAllByText(/Familiar/).length).toBeGreaterThan(0);
    expect(screen.getByText("Returned from Sanctuary path")).toBeInTheDocument();
    expect(screen.getByText("No journeys yet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows max bond, memories, keepsakes, and history", () => {
    renderWithProviders(
      <CreatureProfile
        creatureKey="hello_my_name_is"
        definition={definition}
        earned={earned}
        bond={{ achievement_key: "hello_my_name_is", bond_points: 400, bond_level: 5, updated_at: "2026-09-24T00:00:00Z" }}
        events={[]}
        discoveries={[{ discovery_id: "first_outing_pebble", expedition_id: "e1", unlocked_at: "2026-09-24T00:00:00Z" }]}
        history={[welcomed]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Bond complete. They still join expeditions.")).toBeInTheDocument();
    expect(screen.getByText("Brin sat in the first pot and decided this was home.")).toBeInTheDocument();
    expect(screen.getByText("Warm pebble")).toBeInTheDocument();
    expect(screen.getByText("Sanctuary path")).toBeInTheDocument();
    expect(screen.getAllByText("A small sprout-creature that notices every new leaf.").length).toBeGreaterThan(0);
  });

  it("uses defaults when there is no bond row and shows a secondary talent", () => {
    renderWithProviders(
      <CreatureProfile
        creatureKey="hydration_hero"
        definition={rillDefinition}
        earned={rillEarned}
        bond={null}
        events={[]}
        discoveries={[]}
        history={[]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Rill")).toBeInTheDocument();
    expect(screen.getByText("Recovery")).toBeInTheDocument();
    expect(screen.getByText("Plant knowledge")).toBeInTheDocument();
    expect(screen.getByText("Unlocks at Companion.")).toBeInTheDocument();
    expect(screen.getByText("Journeys and discoveries will collect here.")).toBeInTheDocument();
  });
});
