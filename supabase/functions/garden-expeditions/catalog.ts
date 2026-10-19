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
/** Every expedition leaves with exactly this many creatures. */
export const EXPEDITION_TEAM_SIZE = 3;
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

export interface StoryChapter {
  /** Key under `garden.stories` in the locale files. */
  key: string;
  /** The thread this chapter leaves open, shown under the story. */
  hookKey?: string;
}

export interface DestinationCatalog {
  id: string;
  recommendedTalents: CreatureTalent[];
  durations: DurationKey[];
  minCreatures: number;
  discoveryIds: string[];
  instant?: boolean;
  chapters: StoryChapter[];
  repeatChapters: StoryChapter[];
}

export const DESTINATIONS: DestinationCatalog[] = [
  {
    id: FIRST_OUTING_ID,
    recommendedTalents: ["curiosity"],
    durations: ["instant"],
    minCreatures: EXPEDITION_TEAM_SIZE,
    discoveryIds: ["first_outing_journal", "first_outing_pebble"],
    instant: true,
    chapters: [
      { key: "first_outing_ch1", hookKey: "first_outing_hook1" },
      { key: "first_outing_ch2", hookKey: "first_outing_hook2" },
    ],
    repeatChapters: [
      { key: "first_outing_repeat1", hookKey: "first_outing_hook2" },
    ],
  },
  {
    id: "moss_lane",
    recommendedTalents: ["observation", "navigation"],
    durations: ["laterToday", "tomorrow", "fewDays"],
    minCreatures: EXPEDITION_TEAM_SIZE,
    discoveryIds: ["moss_lane_map", "moss_lane_dew", "moss_lane_keepsake"],
    chapters: [
      { key: "moss_lane_ch1", hookKey: "moss_lane_hook1" },
      { key: "moss_lane_ch2", hookKey: "moss_lane_hook2" },
      { key: "moss_lane_ch3", hookKey: "moss_lane_hook3" },
      { key: "moss_lane_ch4", hookKey: "moss_lane_hook4" },
    ],
    repeatChapters: [
      { key: "moss_lane_repeat1", hookKey: "moss_lane_hook4" },
      { key: "moss_lane_repeat2" },
    ],
  },
  {
    id: "seed_hollow",
    recommendedTalents: ["plantKnowledge", "curiosity"],
    durations: ["laterToday", "tomorrow", "fewDays"],
    minCreatures: EXPEDITION_TEAM_SIZE,
    discoveryIds: ["seed_hollow_seed", "seed_hollow_root", "seed_hollow_keepsake"],
    chapters: [
      { key: "seed_hollow_ch1", hookKey: "seed_hollow_hook1" },
      { key: "seed_hollow_ch2", hookKey: "seed_hollow_hook2" },
      { key: "seed_hollow_ch3", hookKey: "seed_hollow_hook3" },
    ],
    repeatChapters: [
      { key: "seed_hollow_repeat1", hookKey: "seed_hollow_hook3" },
      { key: "seed_hollow_repeat2" },
    ],
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
