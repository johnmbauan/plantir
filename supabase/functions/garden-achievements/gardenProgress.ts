// Manages the `user_garden_progress` row and client-attested events.
// All writes to that table go through this module.

import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOWED_CLIENT_EVENTS, type ClientEventKey, type GardenProgress } from "./achievementTypes.ts";

/** Returns true if `key` is in the server-side whitelist of allowed client-attested event keys. */
function isClientEventKey(key: string): key is ClientEventKey {
  return (ALLOWED_CLIENT_EVENTS as readonly string[]).includes(key);
}

/**
 * Fetches the `user_garden_progress` row for a user, creating it with defaults
 * if it does not yet exist. The double-read pattern handles the race where two
 * concurrent evaluate calls both attempt the initial insert simultaneously.
 */
export async function getOrInsertGardenProgress(
  admin: SupabaseClient,
  userId: string,
): Promise<GardenProgress> {
  const { data: existing, error: readError } = await admin
    .from("user_garden_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing as GardenProgress;

  const { data: inserted, error: insertError } = await admin
    .from("user_garden_progress")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (insertError) {
    const { data: again, error: againError } = await admin
      .from("user_garden_progress")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (againError) throw againError;
    return again as GardenProgress;
  }

  return inserted as GardenProgress;
}

/**
 * Merges a whitelisted client-attested event into `user_garden_progress.client_events`.
 * Rejects keys not in `ALLOWED_CLIENT_EVENTS`. The caller is responsible for
 * running badge evaluation after the update.
 */
export async function writeClientEvent(
  admin: SupabaseClient,
  userId: string,
  eventKey: string,
): Promise<GardenProgress> {
  if (!isClientEventKey(eventKey)) {
    throw new Error(`Event key not allowed: ${eventKey}`);
  }

  const progress = await getOrInsertGardenProgress(admin, userId);
  const nextEvents = { ...(progress.client_events ?? {}), [eventKey]: true };

  const { error } = await admin
    .from("user_garden_progress")
    .update({ client_events: nextEvents })
    .eq("user_id", userId);
  if (error) throw error;

  return { ...progress, client_events: nextEvents };
}

/**
 * Records the current UTC date as the user's last dashboard visit and, if the
 * visit falls within ±2 hours of their configured notification hour, also marks
 * the `alert_hour_visit` client event. The caller is responsible for running
 * badge evaluation after the update.
 */
export async function writeDashboardVisit(
  admin: SupabaseClient,
  userId: string,
): Promise<GardenProgress> {
  const progress = await getOrInsertGardenProgress(admin, userId);
  const todayUtc = new Date().toISOString().slice(0, 10);

  const { data: settings } = await admin
    .from("notification_settings")
    .select("notification_hour, notification_timezone")
    .eq("user_id", userId)
    .maybeSingle();

  let clientEvents = { ...(progress.client_events ?? {}) };

  if (settings) {
    try {
      const tz = String(settings.notification_timezone || "UTC").trim() || "UTC";
      const localHourRaw = Number(
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: tz,
        }).format(new Date()),
      );
      const hour = localHourRaw === 24 ? 0 : localHourRaw;
      const target = Number(settings.notification_hour);
      const delta = Math.abs(hour - target);
      if (delta <= 2 || delta >= 22) {
        clientEvents = { ...clientEvents, alert_hour_visit: true };
      }
    } catch {
      // ignore invalid timezone
    }
  }

  const { error } = await admin
    .from("user_garden_progress")
    .update({
      last_dashboard_visit: todayUtc,
      client_events: clientEvents,
    })
    .eq("user_id", userId);
  if (error) throw error;

  return { ...progress, client_events: clientEvents };
}
