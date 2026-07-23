import type { User } from "@supabase/supabase-js";
import supabase from "@/supabase";

/**
 * Returns the signed-in user from the local session (no network).
 * AuthContext already verifies the JWT via getUser on INITIAL_SESSION;
 * services only need user.id for query filters — RLS still enforces access.
 */
export async function requireUser(): Promise<User> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user;
}

/** Like requireUser, but returns null instead of throwing when signed out. */
export async function getSessionUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}
