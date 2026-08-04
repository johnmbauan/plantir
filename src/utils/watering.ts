import type { MeasurementPoint } from "@/types";

/** Minimum absolute humidity rise (percentage points) that counts as a watering event. */
export const WATERING_HUMIDITY_INCREASE = 30;

/**
 * Finds the most recent watering event from humidity readings sorted ascending by time.
 * A watering is an increase of at least {@link WATERING_HUMIDITY_INCREASE} percentage points
 * between consecutive readings.
 */
export function findLastWateredAt(points: MeasurementPoint[]): string | null {
  let lastWateredAt: string | null = null;

  for (let i = 1; i < points.length; i++) {
    if (points[i].value - points[i - 1].value >= WATERING_HUMIDITY_INCREASE) {
      lastWateredAt = points[i].createdAt;
    }
  }

  return lastWateredAt;
}
