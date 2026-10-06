import { describe, it } from "jsr:@std/testing/bdd";
import { grantCareBonds } from "../../garden-expeditions/care.ts";
import { createClient, USER_ID } from "./mock_client.ts";

const ALL_KEYS = [
  "hello_my_name_is",
  "latin_name_dropper",
  "influencer_garden",
  "stalking_fern_legally",
  "matchmaker_of_moisture",
  "dirt_whisperer_initiate",
  "hydration_hero",
  "the_comeback_kid",
  "back_from_the_mulch",
  "plant_texted_back",
  "cloud_oracle",
  "inbox_compost",
  "time_traveler",
  "midnight_mulcher",
  "face_of_the_garden",
  "seven_days_without_drama",
  "photosynthesis_stan",
  "all_green_no_envy",
];

function unlocks() {
  return ALL_KEYS.map((achievement_key) => ({ achievement_key }));
}

describe("grantCareBonds", () => {
  it("returns when the user has no unlocks", async () => {
    const admin = createClient({ user_achievements: { data: [] } });
    await grantCareBonds(admin as never, USER_ID);
  });

  it("builds care and milestone grants from garden state", async () => {
    const admin = createClient({
      user_achievements: { data: unlocks() },
      plants: { data: [{ id: 11, imageUrl: "photo.jpg", species_id: 4 }] },
      devices: {
        data: [
          { id: 21, plantId: 11, humidity_sensors_config: { calibrated_at: "2026-01-01T00:00:00Z" } },
          { id: 22, plantId: null, humidity_sensors_config: [{ calibrated_at: "2026-01-02T00:00:00Z" }] },
        ],
      },
      profiles: { data: { nickname: "Ada", avatar_url: "https://img" } },
      "notifications:1": {
        data: [
          { id: "w-fast", created_at: "2026-01-01T00:00:00Z", resolved_at: "2026-01-02T00:00:00Z" },
          { id: "w-slow", created_at: "2026-01-01T00:00:00Z", resolved_at: "2026-01-05T00:00:00Z" },
          { id: "w-open", created_at: "2026-01-01T00:00:00Z", resolved_at: null },
        ],
      },
      "notifications:2": { data: [{ id: "off-1" }] },
      user_garden_progress: {
        data: {
          healthy_streak_days: 30,
          client_events: {
            notification_settings_saved: true,
            weather_city_set: true,
            inbox_cleared: true,
            viewed_30d_history: true,
            alert_hour_visit: true,
          },
        },
      },
      "user_sanctuary:1": { data: { last_celebrated_tier: 0 } },
      "user_sanctuary:2": { data: null },
      "user_bond_events:1": { data: [] },
      "user_bond_events:2": { data: null },
      "user_creature_bonds:1": { data: [] },
      "user_creature_bonds:2": { data: null },
    });
    await grantCareBonds(admin as never, USER_ID);
  });

  it("skips the milestone grant when the current tier was already celebrated", async () => {
    const admin = createClient({
      user_achievements: { data: [{ achievement_key: "hello_my_name_is" }] },
      plants: { data: [] },
      devices: { data: [] },
      profiles: { data: null },
      "notifications:1": { data: [] },
      "notifications:2": { data: [] },
      user_garden_progress: { data: { healthy_streak_days: 0, client_events: {} } },
      user_sanctuary: { data: { last_celebrated_tier: 4 } },
    });
    await grantCareBonds(admin as never, USER_ID);
  });
});
