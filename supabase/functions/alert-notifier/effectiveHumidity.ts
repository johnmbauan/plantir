/**
 * Mirrors src/utils/effectiveHumidity.ts + src/constants/potDepth.ts for Deno.
 *
 * Why: the probe only senses ~7 cm. In taller pots a dry surface reading can
 * understate residual moisture lower in the pot, so watering alerts use an
 * effective % derived from raw + potDepthClass. Raw rows in humidity_measurements
 * stay unchanged.
 *
 * Samples (`large`, k=18): 0→0, 5→8, 15→24, 50→68, 100→100.
 * Samples (`deep`, k=25): 15→28, 50→75.
 */

const POT_DEPTH_BOOST_K: Record<string, number> = {
  compact: 0,
  small: 6,
  medium: 12,
  large: 18,
  deep: 25,
  in_ground: 4,
};

function getClampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function getEffectiveHumidity(
  rawPercent: number,
  potDepthClass: string | null | undefined,
): number {
  const raw = getClampPercent(rawPercent);
  if (potDepthClass == null || !(potDepthClass in POT_DEPTH_BOOST_K)) {
    return Math.round(raw);
  }

  const k = POT_DEPTH_BOOST_K[potDepthClass];
  if (k === 0) return Math.round(raw);

  // boostFactor: 0 at 0%/100%, 1 at 50%.
  const boostFactor = 4 * (raw / 100) * (1 - raw / 100);
  return Math.round(getClampPercent(raw + k * boostFactor));
}
