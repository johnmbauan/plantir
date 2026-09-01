import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { jsonStringify } from "../../alert-notifier/utils.ts";

describe("jsonStringify", () => {
  describe("standard JSON behaviour", () => {
    it("serialises a plain object", () => {
      assertEquals(jsonStringify({ a: 1, b: "x" }), JSON.stringify({ a: 1, b: "x" }));
    });

    it("serialises null", () => {
      assertEquals(jsonStringify(null), "null");
    });

    it("serialises an array", () => {
      assertEquals(jsonStringify([1, 2, 3]), "[1,2,3]");
    });

    it("serialises a nested object", () => {
      assertEquals(jsonStringify({ outer: { inner: true } }), '{"outer":{"inner":true}}');
    });
  });

  describe("BigInt handling", () => {
    it("converts a top-level BigInt value to Number", () => {
      assertEquals(jsonStringify({ id: BigInt(42) }), '{"id":42}');
    });

    it("converts a nested BigInt value to Number", () => {
      assertEquals(jsonStringify({ outer: { inner: BigInt(99) } }), '{"outer":{"inner":99}}');
    });

    it("converts BigInt values inside arrays", () => {
      assertEquals(jsonStringify([BigInt(1), BigInt(2)]), "[1,2]");
    });

    it("preserves non-BigInt values alongside BigInt", () => {
      const result = JSON.parse(jsonStringify({ id: BigInt(5), name: "Rose" }));
      assertEquals(result.id, 5);
      assertEquals(result.name, "Rose");
    });
  });
});
