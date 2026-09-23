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
  nameKey: string;
  taglineKey: string;
  minUnlocks: number;
  maxUnlocks: number | null;
  visualStage: GardenVisualStage;
}

export const GARDEN_TIERS: GardenTier[] = [
  {
    id: 0,
    nameKey: "garden.tiers.seedPacket.name",
    taglineKey: "garden.tiers.seedPacket.tagline",
    minUnlocks: 0,
    maxUnlocks: 0,
    visualStage: "soil",
  },
  {
    id: 1,
    nameKey: "garden.tiers.firstPots.name",
    taglineKey: "garden.tiers.firstPots.tagline",
    minUnlocks: 1,
    maxUnlocks: 4,
    visualStage: "soil",
  },
  {
    id: 2,
    nameKey: "garden.tiers.greenfingers.name",
    taglineKey: "garden.tiers.greenfingers.tagline",
    minUnlocks: 5,
    maxUnlocks: 8,
    visualStage: "garden",
  },
  {
    id: 3,
    nameKey: "garden.tiers.secretGarden.name",
    taglineKey: "garden.tiers.secretGarden.tagline",
    minUnlocks: 9,
    maxUnlocks: 12,
    visualStage: "garden",
  },
  {
    id: 4,
    nameKey: "garden.tiers.littleForest.name",
    taglineKey: "garden.tiers.littleForest.tagline",
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
 * Positions are % of the scene container. Clusters match the creature sanctuary:
 * - Sky (top): creatures that can genuinely fly or hover
 * - Left habitat: care and recovery creatures
 * - Center habitat: starter and connection creatures
 * - Right habitat: collection creatures resting on the platform
 * - Clearings and stream (foreground): walkers, prowlers, and grounded creatures
 */
export const GARDEN_LAYOUT: Record<GardenElementId, GardenLayoutSlot> = {
  // Sky — only true flying and hovering creatures
  rain_cloud:      { x: 14, y: 14, size: 44 },
  month_sun:       { x: 66, y: 13, size: 46 },
  ghost_orchid:    { x: 82, y: 35, size: 48 },

  // Left habitat — care and recovery
  phoenix_fern:    { x: 14, y: 46, size: 44 },
  watering_can:    { x: 24, y: 46, size: 50 },
  battery_bush:    { x: 14, y: 53, size: 46 },
  compost_bin:     { x: 24, y: 53, size: 44 },

  // Center habitat — starter growth and connections
  clover_cluster:  { x: 39, y: 44, size: 44 },
  label_stake:     { x: 46, y: 43, size: 46 },
  sprout:          { x: 50, y: 50, size: 54 },
  vine_link:       { x: 55, y: 43, size: 44 },
  sensor_mushroom: { x: 58, y: 51, size: 50 },

  // Right habitat — creatures resting on the platform
  bell_flower:     { x: 75, y: 47, size: 46 },
  camera_sunflower:{ x: 88, y: 47, size: 52 },
  fern_pot:        { x: 81, y: 54, size: 52 },

  // Clearings and stream — grounded creatures aligned with shadows and stones
  magnifier:       { x: 34, y: 65, size: 42 },
  garden_gnome:    { x: 50, y: 70, size: 52 },
  week_wreath:     { x: 14, y: 72, size: 40 },
  hourglass_leaf:  { x: 40, y: 79, size: 40 },
  mirror_pond:     { x: 58, y: 80, size: 50 },
  moon_mushroom:   { x: 88, y: 80, size: 42 },
};
