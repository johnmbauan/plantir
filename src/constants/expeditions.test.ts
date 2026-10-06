import { describe, expect, it } from "vitest";
import {
  availableDestinations,
  bondLevelFromPoints,
  destinationById,
  FIRST_OUTING_ID,
  pointsToNextLevel,
  roundReturnsAt,
  teamTalents,
} from "./expeditions";
import type { AchievementKey } from "./achievements";

describe("expeditions catalog", () => {
  it("maps bond points onto five levels", () => {
    expect(bondLevelFromPoints(0)).toBe(1);
    expect(bondLevelFromPoints(19)).toBe(1);
    expect(bondLevelFromPoints(20)).toBe(2);
    expect(bondLevelFromPoints(80)).toBe(3);
    expect(bondLevelFromPoints(200)).toBe(4);
    expect(bondLevelFromPoints(400)).toBe(5);
  });

  it("computes progress toward the next level", () => {
    expect(pointsToNextLevel(10)).toEqual({ current: 0, next: 20, progress: 0.5 });
    expect(pointsToNextLevel(400).next).toBeNull();
    expect(pointsToNextLevel(400).progress).toBe(1);
  });

  it("filters destinations by unlocked creature count", () => {
    expect(availableDestinations(1).map((item) => item.id)).toEqual([FIRST_OUTING_ID]);
    expect(availableDestinations(3).length).toBe(3);
  });

  it("looks up destinations by id", () => {
    expect(destinationById("moss_lane")?.family).toBe("nearby");
    expect(destinationById("missing")).toBeUndefined();
  });

  it("rounds return times up to even minutes", () => {
    const from = new Date("2026-09-24T12:01:30.000Z");
    const rounded = roundReturnsAt(from, 8);
    expect(rounded.getUTCMinutes() % 2).toBe(0);
    expect(roundReturnsAt(from, 0)).toBe(from);
  });

  it("collects unique team talents", () => {
    const talents = teamTalents(["hello_my_name_is", "hydration_hero"] as AchievementKey[], (id) =>
      id === "hello_my_name_is" ? ["curiosity"] : ["recovery", "curiosity"],
    );
    expect(talents).toEqual(["curiosity", "recovery"]);
  });
});
