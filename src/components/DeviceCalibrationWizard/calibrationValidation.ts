export const CALIBRATION_IDEAL = { dry: 2650, wet: 950 } as const;
export const CALIBRATION_TOLERANCE = 230;

function isWithinTolerance(value: number, ideal: number): boolean {
  return Math.abs(value - ideal) <= CALIBRATION_TOLERANCE;
}

export function isValidDryReading(value: number): boolean {
  return isWithinTolerance(value, CALIBRATION_IDEAL.dry);
}

export function isValidWetReading(value: number): boolean {
  return isWithinTolerance(value, CALIBRATION_IDEAL.wet);
}
