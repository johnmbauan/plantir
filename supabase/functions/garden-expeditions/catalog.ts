export type CreatureTalent =
  | "navigation"
  | "weatherSense"
  | "plantKnowledge"
  | "nightSight"
  | "recovery"
  | "observation"
  | "photography"
  | "communication"
  | "curiosity"
  | "resourcefulness";

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
export const FIRST_OUTING_ID = "first_outing";

export function bondLevelFromPoints(points: number): 1 | 2 | 3 | 4 | 5 {
  if (points >= BOND_LEVEL_THRESHOLDS[4]) return 5;
  if (points >= BOND_LEVEL_THRESHOLDS[3]) return 4;
  if (points >= BOND_LEVEL_THRESHOLDS[2]) return 3;
  if (points >= BOND_LEVEL_THRESHOLDS[1]) return 2;
  return 1;
}

export const CREATURE_TALENTS: Record<string, CreatureTalent[]> = {
  hello_my_name_is: ["curiosity"],
  stalking_fern_legally: ["observation", "resourcefulness"],
  matchmaker_of_moisture: ["communication", "navigation"],
  dirt_whisperer_initiate: ["observation", "curiosity"],
  plant_texted_back: ["communication"],
  fully_rooted_not_emotionally: ["resourcefulness"],
  hydration_hero: ["recovery", "plantKnowledge"],
  back_from_the_mulch: ["recovery", "nightSight"],
  juice_box_refiller: ["resourcefulness"],
  all_green_no_envy: ["plantKnowledge"],
  accidental_collector: ["curiosity"],
  latin_name_dropper: ["plantKnowledge"],
  influencer_garden: ["photography"],
  cloud_oracle: ["weatherSense"],
  face_of_the_garden: ["observation"],
  seven_days_without_drama: ["plantKnowledge", "recovery"],
  photosynthesis_stan: ["weatherSense"],
  the_comeback_kid: ["recovery"],
  inbox_compost: ["resourcefulness", "curiosity"],
  time_traveler: ["navigation"],
  midnight_mulcher: ["nightSight", "navigation"],
};

export interface DestinationCatalog {
  id: string;
  recommendedTalents: CreatureTalent[];
  durations: DurationKey[];
  minCreatures: number;
  discoveryIds: string[];
  instant?: boolean;
  extraStoryKey?: string;
}

export const DESTINATIONS: DestinationCatalog[] = [
  {
    id: FIRST_OUTING_ID,
    recommendedTalents: ["curiosity"],
    durations: ["instant"],
    minCreatures: 1,
    discoveryIds: ["first_outing_journal", "first_outing_pebble"],
    instant: true,
  },
  {
    id: "moss_lane",
    recommendedTalents: ["observation", "navigation"],
    durations: ["laterToday", "tomorrow", "fewDays"],
    minCreatures: 3,
    discoveryIds: ["moss_lane_map", "moss_lane_dew", "moss_lane_keepsake"],
    extraStoryKey: "moss_lane_observation",
  },
  {
    id: "seed_hollow",
    recommendedTalents: ["plantKnowledge", "curiosity"],
    durations: ["laterToday", "tomorrow", "fewDays"],
    minCreatures: 3,
    discoveryIds: ["seed_hollow_seed", "seed_hollow_root", "seed_hollow_keepsake"],
    extraStoryKey: "seed_hollow_plant",
  },
];

export function destinationById(id: string): DestinationCatalog | undefined {
  return DESTINATIONS.find((destination) => destination.id === id);
}

export function roundReturnsAt(from: Date, hours: number): Date {
  if (hours <= 0) return from;
  const raw = new Date(from.getTime() + hours * 60 * 60 * 1000);
  const minutes = raw.getUTCMinutes();
  const add = minutes % 2 === 0 ? 0 : 1;
  raw.setUTCMinutes(minutes + add, 0, 0);
  return raw;
}

export function gardenTierFromCount(count: number): number {
  if (count >= 13) return 4;
  if (count >= 9) return 3;
  if (count >= 5) return 2;
  if (count >= 1) return 1;
  return 0;
}
