import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { asString, asStringArray, objectFromUnknown } from "../../_shared/normalize.ts";

describe("asString", () => {
  describe("non-string input", () => {
    it("returns null for numbers", () => assertEquals(asString(42), null));
    it("returns null for null", () => assertEquals(asString(null), null));
    it("returns null for undefined", () => assertEquals(asString(undefined), null));
    it("returns null for objects", () => assertEquals(asString({}), null));
    it("returns null for arrays", () => assertEquals(asString([]), null));
    it("returns null for booleans", () => assertEquals(asString(true), null));
  });

  describe("blank strings", () => {
    it("returns null for empty string", () => assertEquals(asString(""), null));
    it("returns null for spaces-only string", () => assertEquals(asString("   "), null));
    it("returns null for tab/newline-only string", () => assertEquals(asString("\t\n"), null));
  });

  describe("valid strings", () => {
    it("returns the string unchanged when already trimmed", () => {
      assertEquals(asString("hello"), "hello");
    });

    it("trims leading and trailing whitespace", () => {
      assertEquals(asString("  hello  "), "hello");
    });

    it("trims mixed whitespace characters", () => {
      assertEquals(asString("\t world \n"), "world");
    });
  });
});

describe("asStringArray", () => {
  describe("non-array input", () => {
    it("returns [] for null", () => assertEquals(asStringArray(null), []));
    it("returns [] for undefined", () => assertEquals(asStringArray(undefined), []));
    it("returns [] for a string", () => assertEquals(asStringArray("hello"), []));
    it("returns [] for a number", () => assertEquals(asStringArray(42), []));
    it("returns [] for a plain object", () => assertEquals(asStringArray({}), []));
  });

  describe("array filtering", () => {
    it("returns [] for an empty array", () => assertEquals(asStringArray([]), []));

    it("filters out numbers, null, undefined, booleans and blank strings", () => {
      assertEquals(asStringArray([1, null, undefined, "", "  ", false, {}]), []);
    });

    it("keeps valid strings while discarding invalid entries", () => {
      assertEquals(asStringArray(["a", 1, "b", null, "  ", "c"]), ["a", "b", "c"]);
    });
  });

  describe("string normalisation", () => {
    it("trims each string entry", () => {
      assertEquals(asStringArray(["  hello  ", " world "]), ["hello", "world"]);
    });

    it("preserves all valid strings in order", () => {
      assertEquals(asStringArray(["foo", "bar", "baz"]), ["foo", "bar", "baz"]);
    });
  });
});

describe("objectFromUnknown", () => {
  describe("non-object input", () => {
    it("returns null for null", () => assertEquals(objectFromUnknown(null), null));
    it("returns null for undefined", () => assertEquals(objectFromUnknown(undefined), null));
    it("returns null for 0", () => assertEquals(objectFromUnknown(0), null));
    it("returns null for empty string", () => assertEquals(objectFromUnknown(""), null));
    it("returns null for false", () => assertEquals(objectFromUnknown(false), null));
    it("returns null for a number", () => assertEquals(objectFromUnknown(42), null));
    it("returns null for a non-empty string", () => assertEquals(objectFromUnknown("hello"), null));
    it("returns null for true", () => assertEquals(objectFromUnknown(true), null));
  });

  describe("array input (excluded even though typeof === 'object')", () => {
    it("returns null for []", () => assertEquals(objectFromUnknown([]), null));
    it("returns null for a non-empty array", () => assertEquals(objectFromUnknown([1, 2]), null));
  });

  describe("plain objects", () => {
    it("returns {} for an empty object", () => assertEquals(objectFromUnknown({}), {}));

    it("returns the object as-is", () => {
      const obj = { a: 1, b: "two", c: true };
      assertEquals(objectFromUnknown(obj), obj);
    });

    it("returns nested objects", () => {
      const obj = { x: { y: 1 } };
      assertEquals(objectFromUnknown(obj), obj);
    });
  });
});
