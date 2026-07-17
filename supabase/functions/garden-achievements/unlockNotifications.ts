// Handles persisting achievement unlock notifications to the DB and broadcasting
// them over Supabase Realtime so the bell updates without a page refresh.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AchievementDefinition } from "./achievementTypes.ts";

let broadcastAuth: { supabaseUrl: string; serviceRoleKey: string } | null = null;

/**
 * Stores the Supabase URL and service-role key needed to call the Realtime
 * broadcast API. Must be called once from the edge function entrypoint before
 * any achievement evaluation that may produce unlock notifications.
 */
export function configureAchievementBroadcast(
  supabaseUrl: string,
  serviceRoleKey: string,
): void {
  broadcastAuth = { supabaseUrl, serviceRoleKey };
}

/**
 * Pushes a `notification_created` event to the user's private Realtime channel
 * so the bell updates live without a page refresh. Errors are logged but never
 * thrown — a failed broadcast does not roll back the DB write.
 */
async function broadcastNotification(
  userId: string,
  notification: Record<string, unknown>,
): Promise<void> {
  if (!broadcastAuth) return;

  try {
    const res = await fetch(`${broadcastAuth.supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: broadcastAuth.serviceRoleKey,
        Authorization: `Bearer ${broadcastAuth.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          topic: `user:${userId}`,
          event: "notification_created",
          payload: notification,
          private: true,
        }],
      }),
    });
    if (!res.ok) {
      console.error("Achievement notification broadcast error:", await res.text());
    }
  } catch (err) {
    console.error("Achievement notification broadcast failed:", err);
  }
}

/**
 * For each newly unlocked achievement, inserts a persistent inbox notification
 * and broadcasts it over Realtime. Skips keys that already have a notification
 * row (idempotency guard) and silently ignores 23505 conflicts from concurrent
 * evaluate calls (backed by a unique index on user_id + achievementKey).
 */
export async function persistAndBroadcastUnlockNotifications(
  admin: SupabaseClient,
  userId: string,
  defs: AchievementDefinition[],
): Promise<void> {
  if (defs.length === 0) return;

  const { data: existingNotifs, error: existingError } = await admin
    .from("notifications")
    .select("payload")
    .eq("user_id", userId)
    .eq("type", "achievement");
  if (existingError) {
    console.error("Failed to check existing achievement notifications:", existingError.message);
  }

  const alreadyNotified = new Set(
    (existingNotifs ?? [])
      .map((row) => {
        const payload = row.payload as { achievementKey?: string } | null;
        return payload?.achievementKey ? String(payload.achievementKey) : null;
      })
      .filter((k): k is string => k != null),
  );

  const defsToNotify = defs.filter((d) => !alreadyNotified.has(d.key));
  if (defsToNotify.length === 0) return;

  for (const def of defsToNotify) {
    const { data: inserted, error } = await admin
      .from("notifications")
      .insert({
        user_id: userId,
        type: "achievement",
        title: def.name,
        body: def.description,
        payload: {
          achievementKey: def.key,
          garden_element: def.garden_element,
        },
      })
      .select("id, type, title, body, payload, created_at")
      .maybeSingle();

    if (error) {
      // 23505: concurrent evaluate already wrote this achievement notification.
      if (error.code !== "23505") {
        console.error("Failed to persist achievement notification:", error.message);
      }
      continue;
    }
    if (!inserted) continue;

    await broadcastNotification(userId, {
      id: inserted.id,
      type: inserted.type,
      title: inserted.title,
      body: inserted.body,
      payload: inserted.payload,
      created_at: inserted.created_at,
    });
  }
}
