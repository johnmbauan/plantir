import type { SupabaseClient } from "@supabase/supabase-js";
import { bondLevelFromPoints } from "./catalog.ts";
import { persistBondLevelNotification } from "./notifications.ts";

export interface BondGrant {
  achievementKey: string;
  points: number;
  source: "expedition" | "care" | "milestone";
  reasonCode: string;
  subjectId?: string;
}

function grantKey(achievementKey: string, reasonCode: string, subjectId: string): string {
  return `${achievementKey}|${reasonCode}|${subjectId}`;
}

export async function applyBondGrants(
  admin: SupabaseClient,
  userId: string,
  grants: BondGrant[],
  notifyLevels = false,
): Promise<void> {
  const pending = grants
    .filter((grant) => grant.points > 0)
    .map((grant) => ({
      ...grant,
      subjectId: grant.subjectId ?? "once",
    }));
  if (pending.length === 0) return;

  const achievementKeys = [...new Set(pending.map((grant) => grant.achievementKey))];
  const { data: existingEvents, error: existingError } = await admin
    .from("user_bond_events")
    .select("achievement_key, reason_code, subject_id")
    .eq("user_id", userId)
    .in("achievement_key", achievementKeys);
  if (existingError) throw existingError;

  const have = new Set(
    (existingEvents ?? []).map((row) =>
      grantKey(String(row.achievement_key), String(row.reason_code), String(row.subject_id)),
    ),
  );
  const fresh = pending.filter((grant) => !have.has(grantKey(grant.achievementKey, grant.reasonCode, grant.subjectId)));
  if (fresh.length === 0) return;

  const { error: eventError } = await admin.from("user_bond_events").insert(
    fresh.map((grant) => ({
      user_id: userId,
      achievement_key: grant.achievementKey,
      source: grant.source,
      points: grant.points,
      reason_code: grant.reasonCode,
      subject_id: grant.subjectId,
    })),
  );
  if (eventError) {
    if (eventError.code === "23505") return;
    throw eventError;
  }

  const added = new Map<string, number>();
  for (const grant of fresh) {
    added.set(grant.achievementKey, (added.get(grant.achievementKey) ?? 0) + grant.points);
  }
  const affected = [...added.keys()];

  const { data: bonds, error: bondsError } = await admin
    .from("user_creature_bonds")
    .select("achievement_key, bond_points, bond_level")
    .eq("user_id", userId)
    .in("achievement_key", affected);
  if (bondsError) throw bondsError;

  const byKey = new Map((bonds ?? []).map((row) => [String(row.achievement_key), row]));
  const nextRows = affected.map((key) => {
    const current = byKey.get(key);
    const nextPoints = (current?.bond_points ?? 0) + (added.get(key) ?? 0);
    const previousLevel = current?.bond_level ?? 1;
    const nextLevel = bondLevelFromPoints(nextPoints);
    return {
      user_id: userId,
      achievement_key: key,
      bond_points: nextPoints,
      bond_level: nextLevel,
      updated_at: new Date().toISOString(),
      previousLevel,
      nextLevel,
    };
  });

  const { error: upsertError } = await admin.from("user_creature_bonds").upsert(
    nextRows.map((row) => ({
      user_id: row.user_id,
      achievement_key: row.achievement_key,
      bond_points: row.bond_points,
      bond_level: row.bond_level,
      updated_at: row.updated_at,
    })),
  );
  if (upsertError) throw upsertError;

  if (notifyLevels) {
    for (const row of nextRows) {
      if (row.nextLevel > row.previousLevel) {
        await persistBondLevelNotification(admin, userId, row.achievement_key, row.nextLevel);
      }
    }
  }
}

export async function ensureBondsForUnlocks(
  admin: SupabaseClient,
  userId: string,
): Promise<{ created: number; existingUnlocks: number }> {
  const { data: unlocks, error } = await admin
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  if (error) throw error;

  const keys = (unlocks ?? []).map((row) => String(row.achievement_key));
  if (keys.length === 0) return { created: 0, existingUnlocks: 0 };

  const { data: bonds } = await admin
    .from("user_creature_bonds")
    .select("achievement_key")
    .eq("user_id", userId);
  const have = new Set((bonds ?? []).map((row) => String(row.achievement_key)));
  const missing = keys.filter((key) => !have.has(key));

  if (missing.length > 0) {
    const { error: insertError } = await admin.from("user_creature_bonds").insert(
      missing.map((achievement_key) => ({
        user_id: userId,
        achievement_key,
        bond_points: 0,
        bond_level: 1,
      })),
    );
    if (insertError && insertError.code !== "23505") throw insertError;
  }

  return { created: missing.length, existingUnlocks: keys.length };
}
