import {
  isPotDepthClass,
  POT_DEPTH_BOOST_K,
  type PotDepthClass,
} from "@/constants/potDepth";

/** Keep a percentage in the inclusive 0–100 range. */
function getClampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Maps a raw capacitive-probe reading (0–100) to an *effective* humidity for
 * dashboard display and watering alerts.
 *
 * Why: the Plantir probe only senses ~7 cm of soil. In taller pots the surface
 * dries faster than the lower volume (perched water table), so a low raw
 * reading can understate how wet the pot still is and push users to water too
 * soon. When the plant has a `potDepthClass`, we add a depth-dependent boost.
 * The device still stores the raw percentage unchanged.
 *
 * Shape: boost is 0 at raw 0% and 100%, and peaks at raw 50% (value `k` from
 * {@link POT_DEPTH_BOOST_K}). Near bone-dry readings the adjustment shrinks so
 * a true 0% stays 0% and alerts can still fire.
 *
 * ```
 * boostFactor = 4 * (raw/100) * (1 - raw/100)   // 0 @0%, 1 @50%, 0 @100%
 * effective   = round(clamp(raw + k * boostFactor))
 * ```
 *
 * Null / unknown / `compact` class → identity (no boost).
 *
 * Samples for class `large` (`k = 18`, UI band ~40–60 cm):
 * - raw 0%   → effective 0%
 * - raw 5%   → effective 8%
 * - raw 15%  → effective 24%
 * - raw 50%  → effective 68%
 * - raw 100% → effective 100%
 *
 * Samples for class `deep` (`k = 25`, UI band > 60 cm):
 * - raw 15%  → effective 28%
 * - raw 50%  → effective 75%
 *
 * Samples for class `in_ground` (`k = 4`): small boost only — open soil drains
 * past the roots, so overwatering risk from surface bias is much lower than in
 * a deep pot.
 */
export function getEffectiveHumidity(
  rawPercent: number,
  potDepthClass: PotDepthClass | string | null | undefined,
): number {
  const raw = getClampPercent(rawPercent);
  if (!isPotDepthClass(potDepthClass)) return Math.round(raw);

  const k = POT_DEPTH_BOOST_K[potDepthClass];
  if (k === 0) return Math.round(raw);

  // Parabola peaking at mid-scale: full `k` at 50%, tapering to 0 at both ends.
  const boostFactor = 4 * (raw / 100) * (1 - raw / 100);
  return Math.round(getClampPercent(raw + k * boostFactor));
}
