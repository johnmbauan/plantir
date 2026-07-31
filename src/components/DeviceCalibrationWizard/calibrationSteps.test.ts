import { describe, it, expect } from 'vitest';
import { STEP, isPollingStep } from './calibrationSteps';

describe('calibrationSteps', () => {
  it('defines step indices without an open-device step', () => {
    expect(STEP).toEqual({
      PREPARE: 0,
      WAKE_DEVICE: 1,
      DRY_READING: 2,
      WET_READING: 3,
      COMPLETE: 4,
    });
  });

  it('treats wake through wet as polling steps', () => {
    expect(isPollingStep(STEP.PREPARE)).toBe(false);
    expect(isPollingStep(STEP.WAKE_DEVICE)).toBe(true);
    expect(isPollingStep(STEP.DRY_READING)).toBe(true);
    expect(isPollingStep(STEP.WET_READING)).toBe(true);
    expect(isPollingStep(STEP.COMPLETE)).toBe(false);
  });
});
