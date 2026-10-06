import supabase from "@/supabase";
import { requireUser } from "@/utils/requireUser";
import type { AchievementKey } from "@/constants/achievements";
import type { DurationKey } from "@/constants/expeditions";

export type ExpeditionStatus = "active" | "ready" | "welcomed" | "cancelled";

export interface FrozenOutcome {
  storyKey: string;
  extraStoryKey: string | null;
  discoveryIds: string[];
  talentMatches: string[];
  observations: { achievementKey: AchievementKey; firstVisit: boolean }[];
  bondGrants: { achievementKey: AchievementKey; points: number }[];
}

export interface UserExpedition {
  id: string;
  destination_id: string;
  duration_key: DurationKey;
  team: AchievementKey[];
  started_at: string;
  returns_at: string;
  status: ExpeditionStatus;
  outcome: FrozenOutcome | null;
}

export interface CreatureBond {
  achievement_key: AchievementKey;
  bond_points: number;
  bond_level: number;
  updated_at: string;
}

export interface BondEvent {
  id: string;
  achievement_key: AchievementKey;
  source: "expedition" | "care" | "milestone";
  points: number;
  reason_code: string;
  subject_id: string;
  created_at: string;
}

export interface UserDiscovery {
  discovery_id: string;
  expedition_id: string | null;
  unlocked_at: string;
}

export interface SanctuaryRow {
  intro_completed: boolean;
  visible_decoration_ids: string[];
  last_celebrated_tier: number;
  last_welcomed_expedition_id: string | null;
}

export interface SanctuaryState {
  bonds: CreatureBond[];
  events: BondEvent[];
  expeditions: UserExpedition[];
  discoveries: UserDiscovery[];
  sanctuary: SanctuaryRow | null;
}

type ExpeditionAction =
  | "bootstrap"
  | "depart"
  | "cancel"
  | "welcome"
  | "grant_care"
  | "mark_intro";

async function invokeExpedition(action: ExpeditionAction, extra?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke("garden-expeditions", {
    body: { action, ...extra },
  });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data;
}

export async function bootstrapSanctuary(): Promise<void> {
  await invokeExpedition("bootstrap");
}

export async function grantCareBonds(): Promise<void> {
  try {
    await invokeExpedition("grant_care");
  } catch (err) {
    console.error("Care bond grant failed:", err);
  }
}

export async function departExpedition(
  destinationId: string,
  durationKey: DurationKey,
  team: AchievementKey[],
): Promise<{ expeditionId: string; status: ExpeditionStatus; instant: boolean }> {
  return invokeExpedition("depart", { destinationId, durationKey, team }) as Promise<{
    expeditionId: string;
    status: ExpeditionStatus;
    instant: boolean;
  }>;
}

export async function cancelExpedition(expeditionId: string): Promise<void> {
  await invokeExpedition("cancel", { expeditionId });
}

export async function welcomeExpedition(expeditionId: string): Promise<FrozenOutcome> {
  return invokeExpedition("welcome", { expeditionId }) as Promise<FrozenOutcome>;
}

export async function markIntroCompleted(): Promise<void> {
  await invokeExpedition("mark_intro", { introCompleted: true });
}

export async function fetchSanctuaryState(): Promise<SanctuaryState> {
  const user = await requireUser();

  const [bonds, events, expeditions, discoveries, sanctuary] = await Promise.all([
    supabase
      .from("user_creature_bonds")
      .select("achievement_key, bond_points, bond_level, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("user_bond_events")
      .select("id, achievement_key, source, points, reason_code, subject_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("user_expeditions")
      .select("id, destination_id, duration_key, team, started_at, returns_at, status, outcome")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_discoveries")
      .select("discovery_id, expedition_id, unlocked_at")
      .eq("user_id", user.id),
    supabase
      .from("user_sanctuary")
      .select("intro_completed, visible_decoration_ids, last_celebrated_tier, last_welcomed_expedition_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (bonds.error) throw bonds.error;
  if (events.error) throw events.error;
  if (expeditions.error) throw expeditions.error;
  if (discoveries.error) throw discoveries.error;
  if (sanctuary.error) throw sanctuary.error;

  return {
    bonds: (bonds.data ?? []) as CreatureBond[],
    events: (events.data ?? []) as BondEvent[],
    expeditions: (expeditions.data ?? []) as UserExpedition[],
    discoveries: (discoveries.data ?? []) as UserDiscovery[],
    sanctuary: (sanctuary.data as SanctuaryRow | null) ?? null,
  };
}
