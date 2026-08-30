import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_SKIP_COLUMNS,
  ONBOARDING_STEP_COLUMNS,
  ONBOARDING_STEPS,
  SKIPPABLE_ONBOARDING_STEPS,
  isSkippableOnboardingStep,
} from './onboarding';

describe('onboarding constants', () => {
  it('maps every step to a completion column', () => {
    expect(ONBOARDING_STEPS).toEqual(['plants', 'devices', 'location', 'notifications']);
    expect(ONBOARDING_STEP_COLUMNS.plants).toBe('completed_plants_at');
    expect(ONBOARDING_STEP_COLUMNS.devices).toBe('completed_devices_at');
    expect(ONBOARDING_STEP_COLUMNS.location).toBe('completed_location_at');
    expect(ONBOARDING_STEP_COLUMNS.notifications).toBe('completed_notifications_at');
  });

  it('allows skipping only location and notifications', () => {
    expect(SKIPPABLE_ONBOARDING_STEPS).toEqual(['location', 'notifications']);
    expect(ONBOARDING_SKIP_COLUMNS.location).toBe('skipped_location_at');
    expect(ONBOARDING_SKIP_COLUMNS.notifications).toBe('skipped_notifications_at');
    expect(isSkippableOnboardingStep('plants')).toBe(false);
    expect(isSkippableOnboardingStep('devices')).toBe(false);
    expect(isSkippableOnboardingStep('location')).toBe(true);
    expect(isSkippableOnboardingStep('notifications')).toBe(true);
  });
});
