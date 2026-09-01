import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { getEffectiveHumidity } from "../../alert-notifier/effectiveHumidity.ts";

describe("getEffectiveHumidity", () => {
  it("returns identity for null or compact", () => {
    assertEquals(getEffectiveHumidity(15, null), 15);
    assertEquals(getEffectiveHumidity(15, "compact"), 15);
  });

  it("matches large and deep sample mappings", () => {
    assertEquals(getEffectiveHumidity(0, "large"), 0);
    assertEquals(getEffectiveHumidity(15, "large"), 24);
    assertEquals(getEffectiveHumidity(50, "large"), 68);
    assertEquals(getEffectiveHumidity(15, "deep"), 28);
    assertEquals(getEffectiveHumidity(50, "deep"), 75);
  });
});
