import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { computeOutcome } from "../../garden-expeditions/outcomes.ts";
import { destinationById } from "../../garden-expeditions/catalog.ts";

const moss = destinationById("moss_lane")!;
const first = destinationById("first_outing")!;

describe("computeOutcome", () => {
  it("awards the next discovery without a talent bonus when the team does not match", () => {
    const outcome = computeOutcome(moss, "laterToday", ["hello_my_name_is"], new Set(), new Set());
    assertEquals(outcome.storyKey, "moss_lane");
    assertEquals(outcome.extraStoryKey, null);
    assertEquals(outcome.discoveryIds, ["moss_lane_map"]);
    assertEquals(outcome.talentMatches, []);
    assertEquals(outcome.bondGrants, [{ achievementKey: "hello_my_name_is", points: 24 }]);
    assertEquals(outcome.observations, [{ achievementKey: "hello_my_name_is", firstVisit: true }]);
  });

  it("adds a bonus discovery and extra story when a recommended talent is present", () => {
    const outcome = computeOutcome(
      moss,
      "tomorrow",
      ["stalking_fern_legally"],
      new Set(),
      new Set(),
    );
    assertEquals(outcome.extraStoryKey, "moss_lane_observation");
    assertEquals(outcome.talentMatches, ["observation"]);
    assertEquals(outcome.discoveryIds, ["moss_lane_map", "moss_lane_dew"]);
    assertEquals(outcome.bondGrants[0].points, 72);
  });

  it("skips discoveries already found and marks repeat visits", () => {
    const outcome = computeOutcome(
      moss,
      "fewDays",
      ["hello_my_name_is", "unknown_creature"],
      new Set(["moss_lane_map", "moss_lane_dew", "moss_lane_keepsake"]),
      new Set(["moss_lane:hello_my_name_is"]),
    );
    assertEquals(outcome.discoveryIds, []);
    assertEquals(outcome.observations[0].firstVisit, false);
    assertEquals(outcome.bondGrants[0].points, 216);
  });

  it("uses destination id as the story key on the first outing", () => {
    const outcome = computeOutcome(first, "instant", ["hello_my_name_is"], new Set(), new Set());
    assertEquals(outcome.storyKey, "first_outing");
    assertEquals(outcome.extraStoryKey, null);
    assertEquals(outcome.discoveryIds, ["first_outing_journal", "first_outing_pebble"]);
  });
});
