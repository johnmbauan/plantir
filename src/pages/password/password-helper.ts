import type { User } from "@supabase/supabase-js";

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include one uppercase letter and one number.";

const PENDING_PASSWORD_SETUP_KEY = "plantir:needs_password_setup";

function isInviteCallbackUrl(url: string = window.location.href): boolean {
  const { hash, search } = new URL(url);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(search);
  return hashParams.get("type") === "invite" || searchParams.get("type") === "invite";
}

export function markPendingPasswordSetup(): void {
  sessionStorage.setItem(PENDING_PASSWORD_SETUP_KEY, "1");
}

export function clearPendingPasswordSetup(): void {
  sessionStorage.removeItem(PENDING_PASSWORD_SETUP_KEY);
}

function hasPendingPasswordSetupFlag(): boolean {
  return sessionStorage.getItem(PENDING_PASSWORD_SETUP_KEY) === "1";
}

export function captureInviteCallbackFromUrl(url: string = window.location.href): boolean {
  if (!isInviteCallbackUrl(url)) return false;

  markPendingPasswordSetup();
  return true;
}

function metadataNeedsPasswordSetup(user: User | undefined): boolean {
  const value = user?.user_metadata?.needs_password_setup;
  return value === true || value === "true";
}

export function needsPasswordSetup(user: User | undefined): boolean {
  return metadataNeedsPasswordSetup(user) || hasPendingPasswordSetupFlag();
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  if (!/[A-Z]/.test(password)) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  if (!/\d/.test(password)) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return null;
}
