/** Achievement keys (stable). Display names/copy live in the DB seed. */
export type AchievementKey =
  | "hello_my_name_is"
  | "stalking_fern_legally"
  | "matchmaker_of_moisture"
  | "dirt_whisperer_initiate"
  | "plant_texted_back"
  | "fully_rooted_not_emotionally"
  | "hydration_hero"
  | "back_from_the_mulch"
  | "juice_box_refiller"
  | "all_green_no_envy"
  | "accidental_collector"
  | "latin_name_dropper"
  | "influencer_garden"
  | "cloud_oracle"
  | "face_of_the_garden"
  | "seven_days_without_drama"
  | "photosynthesis_stan"
  | "the_comeback_kid"
  | "inbox_compost"
  | "time_traveler"
  | "midnight_mulcher";

export type GardenElementId =
  | "sprout"
  | "sensor_mushroom"
  | "vine_link"
  | "magnifier"
  | "bell_flower"
  | "garden_gnome"
  | "watering_can"
  | "ghost_orchid"
  | "battery_bush"
  | "clover_cluster"
  | "fern_pot"
  | "label_stake"
  | "camera_sunflower"
  | "rain_cloud"
  | "mirror_pond"
  | "week_wreath"
  | "month_sun"
  | "phoenix_fern"
  | "compost_bin"
  | "hourglass_leaf"
  | "moon_mushroom";

export type GardenVisualStage = "soil" | "garden" | "forest";

export interface GardenTier {
  id: number;
  name: string;
  tagline: string;
  minUnlocks: number;
  maxUnlocks: number | null;
  visualStage: GardenVisualStage;
}

export const GARDEN_TIERS: GardenTier[] = [
  {
    id: 0,
    name: "Seed Packet",
    tagline: "Empty soil. Possibility. A lonely pebble.",
    minUnlocks: 0,
    maxUnlocks: 0,
    visualStage: "soil",
  },
  {
    id: 1,
    name: "First Pots",
    tagline: "Something green is happening.",
    minUnlocks: 1,
    maxUnlocks: 4,
    visualStage: "soil",
  },
  {
    id: 2,
    name: "Greenfingers",
    tagline: "Your garden is getting opinions.",
    minUnlocks: 5,
    maxUnlocks: 8,
    visualStage: "garden",
  },
  {
    id: 3,
    name: "Secret Garden",
    tagline: "Vines, trellis, and quiet pride.",
    minUnlocks: 9,
    maxUnlocks: 12,
    visualStage: "garden",
  },
  {
    id: 4,
    name: "Little Forest",
    tagline: "The canopy has entered the chat.",
    minUnlocks: 13,
    maxUnlocks: null,
    visualStage: "forest",
  },
];

export function getGardenTier(earnedCount: number): GardenTier {
  for (let i = GARDEN_TIERS.length - 1; i >= 0; i--) {
    if (earnedCount >= GARDEN_TIERS[i].minUnlocks) return GARDEN_TIERS[i];
  }
  return GARDEN_TIERS[0];
}

export const GARDEN_PROFILE_HASH = "#garden";
export const GARDEN_PROFILE_PATH = `/profile${GARDEN_PROFILE_HASH}`;

/** Designed scene layout — sole source of truth for badge positions/sizes. */
export interface GardenLayoutSlot {
  x: number;
  y: number;
  size: number;
}

/**
 * Positions are % of the scene container. Clusters match the SVG backdrop:
 * - Sky (top): weather / time badges floating above the garden
 * - Left bed: tools & recovery on the left raised bed
 * - Center bed: first-growth story on the main raised bed
 * - Right bed: display collection on the right raised bed
 * - Path (foreground): accents scattered along the gravel path
 */
export const GARDEN_LAYOUT: Record<GardenElementId, GardenLayoutSlot> = {
  // Sky — spread across the top, clear of beds
  rain_cloud:      { x: 14, y: 10, size: 44 },
  week_wreath:     { x: 36, y:  7, size: 40 },
  month_sun:       { x: 66, y:  6, size: 46 },
  moon_mushroom:   { x: 88, y: 10, size: 42 },

  // Left bed — tools & recovery, 2×2 grid on the raised bed
  phoenix_fern:    { x: 14, y: 46, size: 44 },
  watering_can:    { x: 24, y: 46, size: 50 },
  battery_bush:    { x: 14, y: 53, size: 46 },
  compost_bin:     { x: 24, y: 53, size: 44 },

  // Center bed — starter growth, arranged on the large center bed
  clover_cluster:  { x: 39, y: 44, size: 44 },
  label_stake:     { x: 46, y: 43, size: 46 },
  sprout:          { x: 50, y: 50, size: 54 },
  vine_link:       { x: 55, y: 43, size: 44 },
  sensor_mushroom: { x: 58, y: 51, size: 50 },

  // Right bed — display garden, near the trellis
  bell_flower:     { x: 76, y: 45, size: 46 },
  camera_sunflower:{ x: 88, y: 45, size: 52 },
  ghost_orchid:    { x: 82, y: 52, size: 48 },
  fern_pot:        { x: 76, y: 53, size: 52 },

  // Path / foreground — scattered along the winding gravel path
  magnifier:       { x: 34, y: 64, size: 42 },
  garden_gnome:    { x: 50, y: 70, size: 52 },
  hourglass_leaf:  { x: 42, y: 76, size: 40 },
  mirror_pond:     { x: 56, y: 79, size: 50 },
};
