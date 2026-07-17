// Top-level orchestrators for the achievement system.
// This is the only module the edge function entrypoint (index.ts) needs to import from.

import type { SupabaseClient } from "@supabase/supabase-js";
import { type AchievementDefinition } from "./achievementTypes.ts";
import { computeEligibleBadgeKeys, checkAllMonitoredPlantsHealthy } from "./badgeEligibility.ts";
import { getOrInsertGardenProgress, writeClientEvent, writeDashboardVisit } from "./gardenProgress.ts";
import { persistAndBroadcastUnlockNotifications } from "./unlockNotifications.ts";

export { configureAchievementBroadcast } from "./unlockNotifications.ts";
export type { AchievementDefinition, ClientEventKey } from "./achievementTypes.ts";
export { ALLOWED_CLIENT_EVENTS } from "./achievementTypes.ts";
export { getOrInsertGardenProgress } from "./gardenProgress.ts";

/**
 * Core evaluation entry point. Computes which badges the user now qualifies for,
 * diffs against already-earned rows, inserts only the new ones, and returns
 * their full definitions so the caller can surface unlock toasts.
 *
 * Short-circuits immediately if the user has already earned every badge in the
 * catalog, making repeated calls (e.g. on every Dashboard mount) cheap.
 * Uses upsert with ignoreDuplicates so concurrent calls are race-safe — only
 * the rows this specific call inserted are returned and notified.
 */
export async function evaluateUserAchievements(
  admin: SupabaseClient,
  userId: string,
): Promise<AchievementDefinition[]> {
  const progress = await getOrInsertGardenProgress(admin, userId);

  const { data: allDefs, error: defsError } = await admin
    .from("achievement_definitions")
    .select("key");
  if (defsError) throw defsError;

  const { data: earnedRows, error: earnedError } = await admin
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  if (earnedError) throw earnedError;

  const earnedBefore = new Set((earnedRows ?? []).map((r) => String(r.achievement_key)));
  if (earnedBefore.size >= (allDefs ?? []).length && (allDefs ?? []).length > 0) {
    return [];
  }

  const eligible = await computeEligibleBadgeKeys(admin, userId, progress);
  const toInsert = eligible.filter((k) => !earnedBefore.has(k));
  if (toInsert.length === 0) return [];

  // ignoreDuplicates + RETURNING: only rows this call actually inserted (race-safe).
  const { data: insertedRows, error: insertError } = await admin
    .from("user_achievements")
    .upsert(
      toInsert.map((achievement_key) => ({ user_id: userId, achievement_key })),
      { onConflict: "user_id,achievement_key", ignoreDuplicates: true },
    )
    .select("achievement_key");
  if (insertError) throw insertError;

  const newlyKeys = (insertedRows ?? []).map((r) => String(r.achievement_key));
  if (newlyKeys.length === 0) return [];

  const { data: defs, error: loadError } = await admin
    .from("achievement_definitions")
    .select("key, name, description, garden_element, sort_order, is_hidden")
    .in("key", newlyKeys)
    .order("sort_order", { ascending: true });
  if (loadError) throw loadError;

  const newly = (defs ?? []) as AchievementDefinition[];
  await persistAndBroadcastUnlockNotifications(admin, userId, newly);
  return newly;
}

/**
 * Records a whitelisted client-attested event (e.g. weather city saved, 30-day
 * history opened) in `user_garden_progress.client_events`, then runs a full
 * badge evaluation. Rejects keys not in `ALLOWED_CLIENT_EVENTS`.
 */
export async function trackClientEventAndEvaluate(
  admin: SupabaseClient,
  userId: string,
  eventKey: string,
): Promise<AchievementDefinition[]> {
  await writeClientEvent(admin, userId, eventKey);
  return evaluateUserAchievements(admin, userId);
}

/**
 * Records a dashboard visit date and, if the visit falls within ±2 hours of the
 * user's configured notification hour, marks the `alert_hour_visit` client event.
 * Then runs a full badge evaluation. Called on every Dashboard mount.
 */
export async function trackDashboardVisitAndEvaluate(
  admin: SupabaseClient,
  userId: string,
): Promise<AchievementDefinition[]> {
  await writeDashboardVisit(admin, userId);
  return evaluateUserAchievements(admin, userId);
}

/**
 * Cron entry point — runs once per day at 03:00 UTC.
 * For every user who owns at least one plant, checks whether all monitored
 * plants are healthy and updates `healthy_streak_days` accordingly:
 * - All healthy today: increment streak (or keep if already snapshotted today).
 * - Not all healthy and not yet snapshotted today: reset streak to 0.
 * Runs badge evaluation after a successful healthy snapshot so streak-based
 * badges (7-day, 30-day) unlock as soon as the threshold is crossed.
 */
export async function runDailyHealthyStreakSnapshot(
  admin: SupabaseClient,
): Promise<{ users: number }> {
  const { data: plantUsers, error } = await admin.from("plants").select("user_id");
  if (error) throw error;

  const userIds = [...new Set((plantUsers ?? []).map((p) => String(p.user_id)))];
  const todayUtc = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const userId of userIds) {
    const progress = await getOrInsertGardenProgress(admin, userId);
    const { monitored, allHealthy } = await checkAllMonitoredPlantsHealthy(admin, userId);
    if (monitored < 1) continue;

    if (allHealthy) {
      let streak = 1;
      if (progress.last_all_healthy_date === todayUtc) {
        streak = progress.healthy_streak_days;
      } else if (progress.last_all_healthy_date === yesterday) {
        streak = (progress.healthy_streak_days ?? 0) + 1;
      }

      const { error: updError } = await admin
        .from("user_garden_progress")
        .update({
          healthy_streak_days: streak,
          last_all_healthy_date: todayUtc,
        })
        .eq("user_id", userId);
      if (updError) throw updError;

      await evaluateUserAchievements(admin, userId);
    } else if (progress.last_all_healthy_date !== todayUtc) {
      const { error: resetError } = await admin
        .from("user_garden_progress")
        .update({ healthy_streak_days: 0 })
        .eq("user_id", userId);
      if (resetError) throw resetError;
    }
  }

  return { users: userIds.length };
}
