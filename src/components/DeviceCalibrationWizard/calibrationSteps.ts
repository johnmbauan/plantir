/** Wizard step indices — keep in sync with the Stepper order in index.tsx. */
export const STEP = {
  PREPARE: 0,
  OPEN_DEVICE: 1,
  WAKE_DEVICE: 2,
  DRY_READING: 3,
  WET_READING: 4,
  COMPLETE: 5,
} as const;

/** Steps that poll the device and advance automatically (no Next button). */
export function isPollingStep(step: number): boolean {
  return step >= STEP.WAKE_DEVICE && step <= STEP.WET_READING;
}
