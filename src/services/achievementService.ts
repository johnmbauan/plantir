import { notifications } from "@mantine/notifications";
import supabase from "@/supabase";
import type { AchievementKey, GardenElementId } from "@/constants/achievements";
import { GARDEN_PROFILE_PATH } from "@/constants/achievements";

export interface AchievementDefinition {
  key: AchievementKey;
  name: string;
  description: string;
  garden_element: GardenElementId;
  sort_order: number;
  is_hidden: boolean;
}

export interface EarnedAchievement extends AchievementDefinition {
  unlocked_at: string;
}

export interface GardenState {
  earned: EarnedAchievement[];
  earnedCount: number;
}

type GardenAction = "evaluate" | "record_client_event" | "dashboard_visit";

function mapDefinition(row: Record<string, unknown>): AchievementDefinition {
  return {
    key: row.key as AchievementKey,
    name: String(row.name),
    description: String(row.description),
    garden_element: row.garden_element as GardenElementId,
    sort_order: Number(row.sort_order),
    is_hidden: Boolean(row.is_hidden),
  };
}

async function invokeGarden(
  action: GardenAction,
  extra?: { eventKey?: string },
): Promise<AchievementDefinition[]> {
  const { data, error } = await supabase.functions.invoke("garden-achievements", {
    body: { action, ...extra },
  });

  if (error) throw error;

  if (data && typeof data === "object" && "error" in data && !Array.isArray(data)) {
    throw new Error(String((data as { error: unknown }).error));
  }

  if (!Array.isArray(data)) return [];
  return data.map((row) => mapDefinition(row as Record<string, unknown>));
}

/** Fetches every row from the `achievement_definitions` catalog table. */
export async function fetchAllDefinitions(): Promise<AchievementDefinition[]> {
  const { data, error } = await supabase
    .from("achievement_definitions")
    .select("key, name, description, garden_element, sort_order, is_hidden")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapDefinition(row as Record<string, unknown>));
}

export async function fetchGardenState(): Promise<GardenState> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_achievements")
    .select(
      `unlocked_at, achievement_definitions ( key, name, description, garden_element, sort_order, is_hidden )`,
    )
    .eq("user_id", user.id);

  if (error) throw error;

  const earned: EarnedAchievement[] = (data ?? [])
    .map((row) => {
      const def = row.achievement_definitions as unknown as Record<string, unknown> | null;
      if (!def) return null;
      return {
        ...mapDefinition(def),
        unlocked_at: String(row.unlocked_at),
      };
    })
    .filter((x): x is EarnedAchievement => x !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return { earned, earnedCount: earned.length };
}

export async function evaluateAchievements(): Promise<AchievementDefinition[]> {
  return invokeGarden("evaluate");
}

export async function recordClientEvent(eventKey: string): Promise<AchievementDefinition[]> {
  return invokeGarden("record_client_event", { eventKey });
}

export async function recordDashboardVisit(): Promise<AchievementDefinition[]> {
  return invokeGarden("dashboard_visit");
}

/** Fire-and-forget evaluate that surfaces unlock toasts. Never throws to callers. */
export async function evaluateAndToastUnlocks(): Promise<AchievementDefinition[]> {
  try {
    const newly = await evaluateAchievements();
    showUnlockToasts(newly);
    return newly;
  } catch (err) {
    console.error("Achievement evaluate failed:", err);
    return [];
  }
}

function openGarden(): void {
  if (window.location.pathname === "/profile") {
    document.getElementById("garden")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.location.assign(GARDEN_PROFILE_PATH);
  }
}

export function showUnlockToasts(newAchievements: AchievementDefinition[]): void {
  if (newAchievements.length === 0) return;

  if (newAchievements.length === 1) {
    const a = newAchievements[0];
    notifications.show({
      color: "green",
      title: a.name,
      message: `${a.description} Tap to open your garden.`,
      autoClose: 8000,
      onClick: openGarden,
    });
    return;
  }

  notifications.show({
    color: "green",
    title: "Your garden grew",
    message: `${newAchievements.length} new badges unlocked — tap to open your garden.`,
    autoClose: 8000,
    onClick: openGarden,
  });
}
