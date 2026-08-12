import { describe, it, expect } from "vitest";
import { getEffectiveHumidity } from "@/utils/effectiveHumidity";

describe("getEffectiveHumidity", () => {
  it("returns identity when pot depth is null or unknown", () => {
    expect(getEffectiveHumidity(15, null)).toBe(15);
    expect(getEffectiveHumidity(15, undefined)).toBe(15);
    expect(getEffectiveHumidity(15, "not_a_class")).toBe(15);
  });

  it("returns identity for compact", () => {
    expect(getEffectiveHumidity(0, "compact")).toBe(0);
    expect(getEffectiveHumidity(15, "compact")).toBe(15);
    expect(getEffectiveHumidity(100, "compact")).toBe(100);
  });

  it("maps 0 to 0 and 100 to 100 for deep pots", () => {
    expect(getEffectiveHumidity(0, "large")).toBe(0);
    expect(getEffectiveHumidity(100, "large")).toBe(100);
    expect(getEffectiveHumidity(0, "deep")).toBe(0);
    expect(getEffectiveHumidity(100, "deep")).toBe(100);
  });

  it("applies large-class boost examples", () => {
    expect(getEffectiveHumidity(5, "large")).toBe(8);
    expect(getEffectiveHumidity(15, "large")).toBe(24);
    expect(getEffectiveHumidity(50, "large")).toBe(68);
  });

  it("applies deep and in_ground sample mappings", () => {
    expect(getEffectiveHumidity(15, "deep")).toBe(28);
    expect(getEffectiveHumidity(50, "deep")).toBe(75);
    expect(getEffectiveHumidity(50, "in_ground")).toBe(54);
  });

  it("shrinks the boost near zero compared with mid-range", () => {
    const nearZeroDelta = getEffectiveHumidity(5, "deep") - 5;
    const midDelta = getEffectiveHumidity(50, "deep") - 50;
    expect(nearZeroDelta).toBeLessThan(midDelta);
  });

  it("clamps out-of-range raw values", () => {
    expect(getEffectiveHumidity(-10, "large")).toBe(0);
    expect(getEffectiveHumidity(150, "large")).toBe(100);
  });
});
