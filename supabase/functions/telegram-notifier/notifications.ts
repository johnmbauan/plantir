import type { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import type { InsertedNotification } from "./types.ts";
import { jsonStringify } from "./utils.ts";

async function findExistingNotification(
  connection: PoolClient,
  userId: string,
  type: "watering" | "offline",
  plantId?: number,
): Promise<InsertedNotification | null> {
  if (type === "watering" && plantId != null) {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `SELECT id, created_at FROM notifications
       WHERE user_id = $1 AND type = 'watering'
         AND read_at IS NULL AND resolved_at IS NULL
         AND (payload->>'plantId')::bigint = $2
       LIMIT 1`,
      [userId, plantId],
    );
    return rows[0] ?? null;
  }

  if (type === "offline") {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `SELECT id, created_at FROM notifications
       WHERE user_id = $1 AND type = 'offline'
         AND read_at IS NULL AND resolved_at IS NULL
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  return null;
}

async function broadcastNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  notification: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: jsonStringify({
      messages: [{
        topic: `user:${userId}`,
        event: "notification_created",
        payload: notification,
        private: true,
      }],
    }),
  });

  if (!res.ok) {
    console.error("Realtime broadcast error:", await res.text());
  }
}

/**
 * Upserts a notification row (updating if an unread/unresolved one already exists)
 * and broadcasts it over Supabase Realtime.
 * Returns the notification id, or null on failure.
 */
export async function createInAppNotification(
  connection: PoolClient,
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  type: "watering" | "offline",
  title: string,
  body: string,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const plantId = type === "watering" ? Number(payload.plantId) : undefined;
  const existing = await findExistingNotification(connection, userId, type, plantId);

  let row: InsertedNotification | undefined;

  if (existing) {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `UPDATE notifications
       SET title = $1, body = $2, payload = $3::jsonb, created_at = now()
       WHERE id = $4
       RETURNING id, created_at`,
      [title, body, jsonStringify(payload), existing.id],
    );
    row = rows[0];
  } else {
    const { rows } = await connection.queryObject<InsertedNotification>(
      `INSERT INTO notifications (user_id, type, title, body, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, created_at`,
      [userId, type, title, body, jsonStringify(payload)],
    );
    row = rows[0];
  }

  if (!row) return null;

  await broadcastNotification(supabaseUrl, serviceRoleKey, userId, {
    id: row.id,
    type,
    title,
    body,
    payload,
    created_at: row.created_at,
  });

  return row.id;
}
