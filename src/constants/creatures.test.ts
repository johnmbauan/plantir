import { describe, expect, it } from "vitest";
import { CREATURES, CREATURE_TALENTS, creatureTalents } from "./creatures";
import type { AchievementKey } from "./achievements";
import en from "@/i18n/locales/en.json";
import italian from "@/i18n/locales/it.json";

describe("creatures catalog", () => {
  it("assigns a primary talent to every creature", () => {
    for (const key of Object.keys(CREATURES) as AchievementKey[]) {
      expect(CREATURES[key].primaryTalent).toBeTruthy();
      expect(creatureTalents(key)[0]).toBe(CREATURES[key].primaryTalent);
    }
  });

  it("includes a secondary talent when one is defined", () => {
    expect(creatureTalents("hydration_hero")).toEqual(["recovery", "plantKnowledge"]);
    expect(creatureTalents("hello_my_name_is")).toEqual(["curiosity"]);
  });

  it("uses every talent at least once", () => {
    const used = new Set(Object.values(CREATURES).flatMap((creature) => [
      creature.primaryTalent,
      ...(creature.secondaryTalent ? [creature.secondaryTalent] : []),
    ]));
    expect([...CREATURE_TALENTS].sort()).toEqual([...used].sort());
  });

  it("keeps English and Italian creature catalogs in sync", () => {
    const englishKeys = Object.keys(en.garden.creatures).sort();
    const italianKeys = Object.keys(italian.garden.creatures).sort();
    expect(italianKeys).toEqual(englishKeys);
    expect(englishKeys).toEqual(Object.keys(CREATURES).sort());

    for (const key of englishKeys) {
      const englishEntry = en.garden.creatures[key as keyof typeof en.garden.creatures];
      const italianEntry = italian.garden.creatures[key as keyof typeof italian.garden.creatures];
      expect(englishEntry.name).not.toBe("");
      expect(englishEntry.intro).not.toBe("");
      expect(englishEntry.personality).not.toBe("");
      expect(italianEntry.name).not.toBe("");
      expect(Object.keys(englishEntry.memories)).toEqual(Object.keys(italianEntry.memories));
    }
  });
});
