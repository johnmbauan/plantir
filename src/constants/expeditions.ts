import type { AchievementKey } from "@/constants/achievements";
import type { CreatureTalent } from "@/constants/creatures";

export type ExpeditionFamily =
  | "nearby"
  | "plantLife"
  | "weather"
  | "recovery"
  | "nocturnal"
  | "archive";

export type DurationKey = "instant" | "laterToday" | "tomorrow" | "fewDays";

export const EXPEDITION_DURATIONS: Record<DurationKey, { hours: number; bondPoints: number }> = {
  instant: { hours: 0, bondPoints: 20 },
  laterToday: { hours: 8, bondPoints: 24 },
  tomorrow: { hours: 24, bondPoints: 72 },
  fewDays: { hours: 72, bondPoints: 216 },
};

export const BOND_LEVEL_THRESHOLDS = [0, 20, 80, 200, 400] as const;
export const CARE_BOND_POINTS = 8;
export const MILESTONE_BOND_POINTS = 6;

export function bondLevelFromPoints(points: number): 1 | 2 | 3 | 4 | 5 {
  if (points >= BOND_LEVEL_THRESHOLDS[4]) return 5;
  if (points >= BOND_LEVEL_THRESHOLDS[3]) return 4;
  if (points >= BOND_LEVEL_THRESHOLDS[2]) return 3;
  if (points >= BOND_LEVEL_THRESHOLDS[1]) return 2;
  return 1;
}

export function pointsToNextLevel(points: number): { current: number; next: number | null; progress: number } {
  const level = bondLevelFromPoints(points);
  if (level === 5) {
    return { current: BOND_LEVEL_THRESHOLDS[4], next: null, progress: 1 };
  }
  const current = BOND_LEVEL_THRESHOLDS[level - 1];
  const next = BOND_LEVEL_THRESHOLDS[level];
  return {
    current,
    next,
    progress: next === current ? 1 : Math.min(1, (points - current) / (next - current)),
  };
}

export interface ExpeditionDestination {
  id: string;
  family: ExpeditionFamily;
  recommendedTalents: CreatureTalent[];
  durations: DurationKey[];
  minCreatures: number;
  discoveryIds: string[];
  instant?: boolean;
}

export const FIRST_OUTING_ID = "first_outing";

export const EXPEDITION_DESTINATIONS: ExpeditionDestination[] = [
  {
    id: FIRST_OUTING_ID,
    family: "nearby",
    recommendedTalents: ["curiosity"],
    durations: ["instant"],
    minCreatures: 1,
    discoveryIds: ["first_outing_journal", "first_outing_pebble"],
    instant: true,
  },
  {
    id: "moss_lane",
    family: "nearby",
    recommendedTalents: ["observation", "navigation"],
    durations: ["laterToday", "tomorrow", "fewDays"],
    minCreatures: 3,
    discoveryIds: ["moss_lane_map", "moss_lane_dew", "moss_lane_keepsake"],
  },
  {
    id: "seed_hollow",
    family: "plantLife",
    recommendedTalents: ["plantKnowledge", "curiosity"],
    durations: ["laterToday", "tomorrow", "fewDays"],
    minCreatures: 3,
    discoveryIds: ["seed_hollow_seed", "seed_hollow_root", "seed_hollow_keepsake"],
  },
];

export function destinationById(id: string): ExpeditionDestination | undefined {
  return EXPEDITION_DESTINATIONS.find((destination) => destination.id === id);
}

export function availableDestinations(unlockedCount: number): ExpeditionDestination[] {
  return EXPEDITION_DESTINATIONS.filter((destination) => unlockedCount >= destination.minCreatures);
}

export function roundReturnsAt(from: Date, hours: number): Date {
  if (hours <= 0) return from;
  const raw = new Date(from.getTime() + hours * 60 * 60 * 1000);
  const minutes = raw.getMinutes();
  const roundedMinutes = minutes % 2 === 0 ? minutes : minutes + 1;
  raw.setMinutes(roundedMinutes, 0, 0);
  if (roundedMinutes === 60) {
    raw.setHours(raw.getHours() + 1, 0, 0, 0);
  }
  return raw;
}

export function teamTalents(team: AchievementKey[], talentOf: (id: AchievementKey) => CreatureTalent[]): CreatureTalent[] {
  return [...new Set(team.flatMap(talentOf))];
}
