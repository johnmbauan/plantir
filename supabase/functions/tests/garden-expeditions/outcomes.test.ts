import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { computeOutcome, type OutcomeHistory } from "../../garden-expeditions/outcomes.ts";
import { destinationById } from "../../garden-expeditions/catalog.ts";

const moss = destinationById("moss_lane")!;
const first = destinationById("first_outing")!;

function history(overrides: Partial<OutcomeHistory> = {}): OutcomeHistory {
  return {
    alreadyFound: new Set(),
    visitedKeys: new Set(),
    visitIndex: 0,
    usedChapterKeys: new Set(),
    ...overrides,
  };
}

describe("computeOutcome", () => {
  it("awards the next discovery without a talent bonus when the team does not match", () => {
    const outcome = computeOutcome(moss, "laterToday", ["hello_my_name_is"], history());
    assertEquals(outcome.chapterKey, "moss_lane_ch1");
    assertEquals(outcome.extraChapterKey, null);
    assertEquals(outcome.hookKey, "moss_lane_hook1");
    assertEquals(outcome.discoveryIds, ["moss_lane_map"]);
    assertEquals(outcome.talentMatches, []);
    assertEquals(outcome.bondGrants, [{ achievementKey: "hello_my_name_is", points: 24 }]);
    assertEquals(outcome.observations, [{ achievementKey: "hello_my_name_is", firstVisit: true }]);
  });

  it("adds a bonus discovery and extra story when a recommended talent is present", () => {
    const outcome = computeOutcome(moss, "tomorrow", ["stalking_fern_legally"], history());
    assertEquals(outcome.extraChapterKey, "moss_lane_ch2");
    assertEquals(outcome.talentMatches, ["observation"]);
    assertEquals(outcome.discoveryIds, ["moss_lane_map", "moss_lane_dew"]);
    assertEquals(outcome.bondGrants[0].points, 72);
  });

  it("skips discoveries already found and marks repeat visits", () => {
    const outcome = computeOutcome(
      moss,
      "fewDays",
      ["hello_my_name_is", "unknown_creature"],
      history({
        alreadyFound: new Set(["moss_lane_map", "moss_lane_dew", "moss_lane_keepsake"]),
        visitedKeys: new Set(["moss_lane:hello_my_name_is"]),
      }),
    );
    assertEquals(outcome.discoveryIds, []);
    assertEquals(outcome.observations[0].firstVisit, false);
    assertEquals(outcome.bondGrants[0].points, 216);
  });

  it("opens the first outing on its first two chapters when curiosity is present", () => {
    const outcome = computeOutcome(first, "instant", ["hello_my_name_is"], history());
    assertEquals(outcome.chapterKey, "first_outing_ch1");
    assertEquals(outcome.extraChapterKey, "first_outing_ch2");
    assertEquals(outcome.discoveryIds, ["first_outing_journal", "first_outing_pebble"]);
  });
});
