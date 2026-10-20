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
const unlockedDate = new Date("2026-09-24T00:00:00Z").toLocaleDateString("en-US");

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
  it("puts identity in the header and starts with the bond", async () => {
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
        history={[welcomed]}
        onClose={onClose}
      />,
    );
    expect(screen.getByText("Brin")).toBeInTheDocument();
    expect(screen.getByText("A small sprout-creature that notices every new leaf.")).toBeInTheDocument();
    expect(screen.getByText("Eager, gentle, and always first to look around a corner.")).toBeInTheDocument();
    expect(screen.getByText("Familiar")).toBeInTheDocument();
    expect(screen.getByText("25 / 80")).toBeInTheDocument();
    expect(screen.getByText("Next level: Trusted")).toBeInTheDocument();
    expect(screen.getAllByText("Sanctuary path")).toHaveLength(1);
    expect(screen.getByText("The bond grew.")).toBeInTheDocument();
    expect(screen.queryByText("An outing")).not.toBeInTheDocument();
    expect(screen.getByText(`First Plant, ${unlockedDate}`)).toBeInTheDocument();
    await user.hover(screen.getByRole("button", { name: "About Bond" }));
    expect(await screen.findByText("The bond grows when this creature comes home from an expedition, and a little whenever you look after your plants.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows max bond, memories, and one outing with its treasure", () => {
    renderWithProviders(
      <CreatureProfile
        creatureKey="hello_my_name_is"
        definition={definition}
        earned={earned}
        bond={{ achievement_key: "hello_my_name_is", bond_points: 400, bond_level: 5, updated_at: "2026-09-24T00:00:00Z" }}
        events={[{
          id: "ev1",
          achievement_key: "hello_my_name_is",
          source: "expedition",
          points: 20,
          reason_code: "expedition",
          subject_id: "e1",
          created_at: "2026-09-24T00:00:00Z",
        }]}
        discoveries={[{ discovery_id: "first_outing_pebble", expedition_id: "e1", unlocked_at: "2026-09-24T00:00:00Z" }]}
        history={[welcomed]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("This is as close as you can be.")).toBeInTheDocument();
    expect(screen.getByText("Open. Send it from the button at the top.")).toBeInTheDocument();
    expect(screen.getByText("Brin sat in the first pot and decided this was home.")).toBeInTheDocument();
    expect(screen.getAllByText("Sanctuary path")).toHaveLength(1);
    expect(screen.getByText("Warm pebble")).toBeInTheDocument();
    expect(screen.getByText("The bond grew.")).toBeInTheDocument();
    expect(screen.queryByText("An outing")).not.toBeInTheDocument();
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
    expect(screen.getByText("Not open yet.")).toBeInTheDocument();
    expect(screen.getByText("No outings yet.")).toBeInTheDocument();
    expect(screen.getByText("None yet. The first appears at Familiar.")).toBeInTheDocument();
  });

  it("lists a care event with a date and no blank destination", () => {
    renderWithProviders(
      <CreatureProfile
        creatureKey="hello_my_name_is"
        definition={definition}
        earned={earned}
        bond={{ achievement_key: "hello_my_name_is", bond_points: 8, bond_level: 1, updated_at: "2026-09-24T00:00:00Z" }}
        events={[{
          id: "care1",
          achievement_key: "hello_my_name_is",
          source: "care",
          points: 8,
          reason_code: "care_profile",
          subject_id: "once",
          created_at: "2026-09-24T00:00:00Z",
        }]}
        discoveries={[]}
        history={[]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("The bond grew because you finished your garden profile.")).toBeInTheDocument();
    expect(screen.queryByText(/from \.$/)).not.toBeInTheDocument();
    expect(screen.getByText(unlockedDate)).toBeInTheDocument();
  });

  it("does not invent a place name for an outing with an unknown trail", () => {
    renderWithProviders(
      <CreatureProfile
        creatureKey="hello_my_name_is"
        definition={definition}
        earned={earned}
        bond={{ achievement_key: "hello_my_name_is", bond_points: 20, bond_level: 2, updated_at: "2026-09-24T00:00:00Z" }}
        events={[{
          id: "ev-unknown",
          achievement_key: "hello_my_name_is",
          source: "expedition",
          points: 20,
          reason_code: "expedition",
          subject_id: "exp-uuid-not-a-trail",
          created_at: "2026-09-24T00:00:00Z",
        }]}
        discoveries={[]}
        history={[]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("An outing")).toBeInTheDocument();
    expect(screen.getByText("The bond grew.")).toBeInTheDocument();
    expect(screen.queryByText(/from \.$/)).not.toBeInTheDocument();
  });

  it("keeps an unnamed trail as a single outing", () => {
    renderWithProviders(
      <CreatureProfile
        creatureKey="hello_my_name_is"
        definition={definition}
        earned={earned}
        bond={{ achievement_key: "hello_my_name_is", bond_points: 20, bond_level: 2, updated_at: "2026-09-24T00:00:00Z" }}
        events={[]}
        discoveries={[]}
        history={[{ ...welcomed, destination_id: "unknown_trail", returns_at: "" }]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("An outing")).toBeInTheDocument();
    expect(screen.queryByText("The bond grew.")).not.toBeInTheDocument();
  });
});
