export const ONBOARDING_STEPS = ["plants", "devices", "location", "notifications"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const SKIPPABLE_ONBOARDING_STEPS = ["location", "notifications"] as const;

export type SkippableOnboardingStep = (typeof SKIPPABLE_ONBOARDING_STEPS)[number];

export const ONBOARDING_CHANGED_EVENT = "plantir-onboarding-changed";

export const ONBOARDING_STEP_COLUMNS = {
  plants: "completed_plants_at",
  devices: "completed_devices_at",
  location: "completed_location_at",
  notifications: "completed_notifications_at",
} as const;

export const ONBOARDING_SKIP_COLUMNS = {
  location: "skipped_location_at",
  notifications: "skipped_notifications_at",
} as const;

export function isSkippableOnboardingStep(step: OnboardingStep): step is SkippableOnboardingStep {
  return (SKIPPABLE_ONBOARDING_STEPS as readonly OnboardingStep[]).includes(step);
}
