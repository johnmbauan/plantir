import { describe, it, expect } from "vitest";
import { isValidSemver } from "@/admin/semver";

describe("isValidSemver", () => {
  it("accepts core and pre-release SemVer strings", () => {
    expect(isValidSemver("1.0.0")).toBe(true);
    expect(isValidSemver("1.2.3")).toBe(true);
    expect(isValidSemver("1.2.0-beta.1")).toBe(true);
    expect(isValidSemver(" 2.0.0 ")).toBe(true);
  });

  it("rejects invalid SemVer strings", () => {
    expect(isValidSemver("")).toBe(false);
    expect(isValidSemver("1.0")).toBe(false);
    expect(isValidSemver("v1.0.0")).toBe(false);
    expect(isValidSemver("1")).toBe(false);
  });
});
