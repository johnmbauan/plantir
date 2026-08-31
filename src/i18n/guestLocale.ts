export const GUEST_LOCALE_STORAGE_KEY = "plantir-locale";

export type GuestLocale = "it" | "en";

export function readGuestLocale(): GuestLocale {
  try {
    const stored = localStorage.getItem(GUEST_LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "it") return stored;
  } catch {
    // private mode or unavailable storage
  }
  return "it";
}

export function writeGuestLocale(locale: GuestLocale): void {
  try {
    localStorage.setItem(GUEST_LOCALE_STORAGE_KEY, locale);
  } catch {
    // private mode or unavailable storage
  }
}
