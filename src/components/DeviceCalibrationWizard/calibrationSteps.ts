/** Wizard step indices — keep in sync with the Stepper order in index.tsx. */
export const STEP = {
  PREPARE: 0,
  WAKE_DEVICE: 1,
  DRY_READING: 2,
  WET_READING: 3,
  COMPLETE: 4,
} as const;

/** Steps that poll the device and advance automatically (no Next button). */
export function isPollingStep(step: number): boolean {
  return step >= STEP.WAKE_DEVICE && step <= STEP.WET_READING;
}
