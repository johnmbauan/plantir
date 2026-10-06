import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import {
  BOND_LEVEL_THRESHOLDS,
  bondLevelFromPoints,
  destinationById,
  DESTINATIONS,
  FIRST_OUTING_ID,
  gardenTierFromCount,
  roundReturnsAt,
} from "../../garden-expeditions/catalog.ts";

describe("bondLevelFromPoints", () => {
  it("maps each threshold onto a level", () => {
    assertEquals(bondLevelFromPoints(0), 1);
    assertEquals(bondLevelFromPoints(19), 1);
    assertEquals(bondLevelFromPoints(BOND_LEVEL_THRESHOLDS[1]), 2);
    assertEquals(bondLevelFromPoints(BOND_LEVEL_THRESHOLDS[2]), 3);
    assertEquals(bondLevelFromPoints(BOND_LEVEL_THRESHOLDS[3]), 4);
    assertEquals(bondLevelFromPoints(BOND_LEVEL_THRESHOLDS[4]), 5);
  });
});

describe("destination catalog", () => {
  it("finds destinations by id and returns undefined when missing", () => {
    assertEquals(destinationById(FIRST_OUTING_ID)?.instant, true);
    assertEquals(destinationById("missing"), undefined);
    assertEquals(DESTINATIONS.length >= 3, true);
  });
});

describe("roundReturnsAt", () => {
  it("returns the start time for instant expeditions", () => {
    const from = new Date("2026-10-06T12:01:00.000Z");
    assertEquals(roundReturnsAt(from, 0), from);
  });

  it("rounds odd UTC minutes up to an even minute", () => {
    const from = new Date("2026-10-06T12:01:30.000Z");
    const rounded = roundReturnsAt(from, 8);
    assertEquals(rounded.getUTCMinutes() % 2, 0);
    assertEquals(rounded.getUTCSeconds(), 0);
  });

  it("keeps even UTC minutes unchanged", () => {
    const from = new Date("2026-10-06T12:00:00.000Z");
    const rounded = roundReturnsAt(from, 8);
    assertEquals(rounded.getUTCMinutes(), 0);
  });
});

describe("gardenTierFromCount", () => {
  it("returns sanctuary tiers from unlock counts", () => {
    assertEquals(gardenTierFromCount(0), 0);
    assertEquals(gardenTierFromCount(1), 1);
    assertEquals(gardenTierFromCount(5), 2);
    assertEquals(gardenTierFromCount(9), 3);
    assertEquals(gardenTierFromCount(13), 4);
  });
});
