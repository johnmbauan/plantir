import { describe, it, expect } from "vitest";
import {
  isPotDepthClass,
  POT_DEPTH_CLASSES,
  POT_DEPTH_BOOST_K,
  POT_DEPTH_INFO_TOOLTIP,
  POT_DEPTH_SELECT_OPTIONS,
} from "@/constants/potDepth";

describe("potDepth constants", () => {
  it("lists every class exactly once in boost and select maps", () => {
    expect(Object.keys(POT_DEPTH_BOOST_K).sort()).toEqual([...POT_DEPTH_CLASSES].sort());
    const selectValues = POT_DEPTH_SELECT_OPTIONS
      .map((option) => option.value)
      .filter((value) => value !== "");
    expect(selectValues).toEqual([...POT_DEPTH_CLASSES]);
  });

  it("exposes cm labels only in select options, not in class keys", () => {
    for (const key of POT_DEPTH_CLASSES) {
      expect(key).not.toMatch(/\d/);
    }
    expect(POT_DEPTH_SELECT_OPTIONS.map((option) => option.label)).toEqual([
      "Not sure / skip",
      "≤ 15 cm",
      "15–25 cm",
      "25–40 cm",
      "40–60 cm",
      "> 60 cm",
      "In the ground",
    ]);
  });
});

describe("isPotDepthClass", () => {
  it("accepts known classes and rejects everything else", () => {
    expect(isPotDepthClass("large")).toBe(true);
    expect(isPotDepthClass("in_ground")).toBe(true);
    expect(isPotDepthClass(null)).toBe(false);
    expect(isPotDepthClass(undefined)).toBe(false);
    expect(isPotDepthClass("")).toBe(false);
    expect(isPotDepthClass("pot_40_60")).toBe(false);
  });
});
