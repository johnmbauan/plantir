import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_LOCALE_STORAGE_KEY,
  readGuestLocale,
  writeGuestLocale,
} from "./guestLocale";

describe("guestLocale", () => {
  afterEach(() => {
    localStorage.removeItem(GUEST_LOCALE_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it("returns Italian when nothing is stored", () => {
    expect(readGuestLocale()).toBe("it");
  });

  it("returns a stored English or Italian locale", () => {
    localStorage.setItem(GUEST_LOCALE_STORAGE_KEY, "en");
    expect(readGuestLocale()).toBe("en");

    localStorage.setItem(GUEST_LOCALE_STORAGE_KEY, "it");
    expect(readGuestLocale()).toBe("it");
  });

  it("returns Italian for an unknown stored value", () => {
    localStorage.setItem(GUEST_LOCALE_STORAGE_KEY, "fr");
    expect(readGuestLocale()).toBe("it");
  });

  it("returns Italian when storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readGuestLocale()).toBe("it");
  });

  it("persists the guest locale", () => {
    writeGuestLocale("en");
    expect(localStorage.getItem(GUEST_LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("ignores write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => writeGuestLocale("en")).not.toThrow();
  });
});
