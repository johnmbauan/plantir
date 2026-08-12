/**
 * Stable pot-depth class keys. Do not encode cm ranges in the key —
 * display thresholds live only in POT_DEPTH_SELECT_OPTIONS labels and can change.
 */
export const POT_DEPTH_CLASSES = [
  "compact",
  "small",
  "medium",
  "large",
  "deep",
  "in_ground",
] as const;

export type PotDepthClass = (typeof POT_DEPTH_CLASSES)[number];

/** Max boost (percentage points) at raw humidity 50%. */
export const POT_DEPTH_BOOST_K: Record<PotDepthClass, number> = {
  compact: 0,
  small: 6,
  medium: 12,
  large: 18,
  deep: 25,
  in_ground: 4,
};

/** UI labels (cm bands). Change these freely without renaming stored class keys. */
export const POT_DEPTH_SELECT_OPTIONS: { value: PotDepthClass | ""; label: string }[] = [
  { value: "", label: "Not sure / skip" },
  { value: "compact", label: "≤ 15 cm" },
  { value: "small", label: "15–25 cm" },
  { value: "medium", label: "25–40 cm" },
  { value: "large", label: "40–60 cm" },
  { value: "deep", label: "> 60 cm" },
  { value: "in_ground", label: "In the ground" },
];

export const POT_DEPTH_INFO_TOOLTIP =
  "In taller pots, the surface can dry out sooner than the soil below. " +
  "Plantir uses pot height to give you more reliable humidity readings and watering alerts.";

export function isPotDepthClass(value: string | null | undefined): value is PotDepthClass {
  return value != null && (POT_DEPTH_CLASSES as readonly string[]).includes(value);
}
