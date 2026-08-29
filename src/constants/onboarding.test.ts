import { describe, it, expect, beforeEach } from 'vitest';
import {
  ONBOARDING_DISMISSED_KEY,
  isOnboardingActive,
  shouldReturnToDashboardAfterFirstCreate,
} from './onboarding';

describe('isOnboardingActive', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is true when onboarding has not been dismissed', () => {
    expect(isOnboardingActive()).toBe(true);
  });

  it('is false when onboarding has been dismissed', () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    expect(isOnboardingActive()).toBe(false);
  });
});

describe('shouldReturnToDashboardAfterFirstCreate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is true for the first item while onboarding is active', () => {
    expect(shouldReturnToDashboardAfterFirstCreate(0)).toBe(true);
  });

  it('is false for a later item while onboarding is still active', () => {
    expect(shouldReturnToDashboardAfterFirstCreate(1)).toBe(false);
  });

  it('is false for the first item after onboarding is dismissed', () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    expect(shouldReturnToDashboardAfterFirstCreate(0)).toBe(false);
  });
});
