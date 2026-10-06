import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DESTINATIONS,
  EXPEDITION_DURATIONS,
  FIRST_OUTING_ID,
  destinationById,
  roundReturnsAt,
  type DurationKey,
} from "./catalog.ts";
import { applyBondGrants, ensureBondsForUnlocks } from "./bonds.ts";
import { computeOutcome, type FrozenOutcome } from "./outcomes.ts";
import { persistReturnNotification, sendExternalReturnNotice } from "./notifications.ts";
import { grantCareBonds } from "./care.ts";

async function unlockedKeys(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await admin
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.achievement_key));
}

async function ensureSanctuaryRow(admin: SupabaseClient, userId: string): Promise<void> {
  const { data } = await admin.from("user_sanctuary").select("user_id").eq("user_id", userId).maybeSingle();
  if (data) return;
  const { error } = await admin.from("user_sanctuary").insert({
    user_id: userId,
    intro_completed: false,
  });
  if (error && error.code !== "23505") throw error;
}

export async function bootstrapSanctuary(admin: SupabaseClient, userId: string): Promise<void> {
  await Promise.all([
    ensureBondsForUnlocks(admin, userId),
    ensureSanctuaryRow(admin, userId),
  ]);
  await grantCareBonds(admin, userId);
}

export async function depart(
  admin: SupabaseClient,
  userId: string,
  destinationId: string,
  durationKey: DurationKey,
  team: string[],
): Promise<{ expeditionId: string; status: string; instant: boolean }> {
  if (team.length < 1 || team.length > 3) throw new Error("Team must have one to three creatures");
  const unique = new Set(team);
  if (unique.size !== team.length) throw new Error("Team members must be unique");

  const destination = destinationById(destinationId);
  if (!destination) throw new Error("Unknown destination");
  if (!destination.durations.includes(durationKey)) throw new Error("Duration is not available for this route");

  const unlocked = await unlockedKeys(admin, userId);
  if (unlocked.length < destination.minCreatures) throw new Error("Destination is not available yet");
  if (team.some((key) => !unlocked.includes(key))) throw new Error("Every team member must be unlocked");

  const { data: open } = await admin
    .from("user_expeditions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "ready"])
    .maybeSingle();
  if (open) throw new Error("An expedition is already in progress");

  const now = new Date();
  const returnsAt = roundReturnsAt(now, EXPEDITION_DURATIONS[durationKey].hours);
  const instant = Boolean(destination.instant || durationKey === "instant");

  let outcome: FrozenOutcome | null = null;
  if (instant) {
    outcome = await freezeOutcome(admin, userId, destination, durationKey, team);
  }

  const { data, error } = await admin
    .from("user_expeditions")
    .insert({
      user_id: userId,
      destination_id: destinationId,
      duration_key: durationKey,
      team,
      started_at: now.toISOString(),
      returns_at: returnsAt.toISOString(),
      status: instant ? "ready" : "active",
      outcome,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (instant) {
    await persistReturnNotification(admin, userId, data.id, destinationId);
  }

  return { expeditionId: data.id, status: instant ? "ready" : "active", instant };
}

async function freezeOutcome(
  admin: SupabaseClient,
  userId: string,
  destination: NonNullable<ReturnType<typeof destinationById>>,
  durationKey: DurationKey,
  team: string[],
): Promise<FrozenOutcome> {
  const dest = destination;
  const { data: found } = await admin
    .from("user_discoveries")
    .select("discovery_id")
    .eq("user_id", userId);
  const alreadyFound = new Set((found ?? []).map((row) => String(row.discovery_id)));

  const { data: history } = await admin
    .from("user_expeditions")
    .select("destination_id, team, status")
    .eq("user_id", userId)
    .in("status", ["ready", "welcomed"]);
  const visited = new Set<string>();
  for (const row of history ?? []) {
    for (const member of row.team ?? []) {
      visited.add(`${row.destination_id}:${member}`);
    }
  }

  return computeOutcome(dest, durationKey, team, alreadyFound, visited);
}

export async function completeDue(admin: SupabaseClient): Promise<{ completed: number }> {
  const { data: due, error } = await admin
    .from("user_expeditions")
    .select("id, user_id, destination_id, duration_key, team")
    .eq("status", "active")
    .lte("returns_at", new Date().toISOString());
  if (error) throw error;

  let completed = 0;
  for (const row of due ?? []) {
    const destination = destinationById(String(row.destination_id));
    if (!destination) continue;

    const { data: claimed, error: claimError } = await admin
      .from("user_expeditions")
      .update({ status: "ready" })
      .eq("id", row.id)
      .eq("status", "active")
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) continue;

    const outcome = await freezeOutcome(
      admin,
      String(row.user_id),
      destination,
      row.duration_key as DurationKey,
      row.team as string[],
    );

    const { error: outcomeError } = await admin
      .from("user_expeditions")
      .update({ outcome })
      .eq("id", row.id);
    if (outcomeError) throw outcomeError;

    await persistReturnNotification(admin, String(row.user_id), String(row.id), String(row.destination_id));
    await sendExternalReturnNotice(admin, String(row.user_id));
    await admin
      .from("user_expeditions")
      .update({ externally_notified_at: new Date().toISOString() })
      .eq("id", row.id);
    completed += 1;
  }

  return { completed };
}

export async function cancelExpedition(admin: SupabaseClient, userId: string, expeditionId: string): Promise<void> {
  const { data, error } = await admin
    .from("user_expeditions")
    .update({ status: "cancelled", outcome: null })
    .eq("id", expeditionId)
    .eq("user_id", userId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No active expedition to cancel");
}

export async function welcomeExpedition(
  admin: SupabaseClient,
  userId: string,
  expeditionId: string,
): Promise<FrozenOutcome> {
  const { data: row, error } = await admin
    .from("user_expeditions")
    .select("id, destination_id, outcome, status")
    .eq("id", expeditionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!row || row.status !== "ready" || !row.outcome) throw new Error("Expedition is not ready to welcome");

  const outcome = row.outcome as FrozenOutcome;

  await applyBondGrants(
    admin,
    userId,
    outcome.bondGrants.map((grant) => ({
      achievementKey: grant.achievementKey,
      points: grant.points,
      source: "expedition",
      reasonCode: "expedition",
      subjectId: expeditionId,
    })),
    true,
  );

  if (outcome.discoveryIds.length > 0) {
    const { error: discoveryError } = await admin.from("user_discoveries").upsert(
      outcome.discoveryIds.map((discovery_id) => ({
        user_id: userId,
        discovery_id,
        expedition_id: expeditionId,
      })),
      { onConflict: "user_id,discovery_id", ignoreDuplicates: true },
    );
    if (discoveryError) throw discoveryError;
  }

  const { error: welcomeError } = await admin
    .from("user_expeditions")
    .update({ status: "welcomed" })
    .eq("id", expeditionId)
    .eq("user_id", userId)
    .eq("status", "ready");
  if (welcomeError) throw welcomeError;

  await admin.from("user_sanctuary").upsert({
    user_id: userId,
    last_welcomed_expedition_id: expeditionId,
    intro_completed: true,
    updated_at: new Date().toISOString(),
  });

  return outcome;
}

export async function markIntro(admin: SupabaseClient, userId: string, completed: boolean): Promise<void> {
  await admin.from("user_sanctuary").upsert({
    user_id: userId,
    intro_completed: completed,
    updated_at: new Date().toISOString(),
  });
}

export { DESTINATIONS, FIRST_OUTING_ID };
