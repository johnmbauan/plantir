export const ONBOARDING_DISMISSED_KEY = "onboarding_dismissed";

export function isOnboardingActive(): boolean {
  return localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== "true";
}

export function shouldReturnToDashboardAfterFirstCreate(existingCount: number): boolean {
  return isOnboardingActive() && existingCount === 0;
}
