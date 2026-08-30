import { notifications } from "@mantine/notifications";
import supabase from "@/supabase";
import i18n from "@/i18n";
import { requireUser } from "@/utils/requireUser";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/services/notificationService";
import {
  ONBOARDING_CHANGED_EVENT,
  ONBOARDING_SKIP_COLUMNS,
  ONBOARDING_STEP_COLUMNS,
  ONBOARDING_STEPS,
  isSkippableOnboardingStep,
  type OnboardingStep,
  type SkippableOnboardingStep,
} from "@/constants/onboarding";

export interface OnboardingProgress {
  completedPlantsAt: string | null;
  completedDevicesAt: string | null;
  completedLocationAt: string | null;
  completedNotificationsAt: string | null;
  skippedLocationAt: string | null;
  skippedNotificationsAt: string | null;
  dismissedAt: string | null;
}

export interface OnboardingStepResult {
  newlyCompleted: boolean;
  dismissed: boolean;
}

type OnboardingRow = {
  completed_plants_at: string | null;
  completed_devices_at: string | null;
  completed_location_at: string | null;
  completed_notifications_at: string | null;
  skipped_location_at: string | null;
  skipped_notifications_at: string | null;
  dismissed_at: string | null;
};

const ONBOARDING_SELECT =
  "completed_plants_at, completed_devices_at, completed_location_at, completed_notifications_at, skipped_location_at, skipped_notifications_at, dismissed_at";

export const EMPTY_ONBOARDING: OnboardingProgress = {
  completedPlantsAt: null,
  completedDevicesAt: null,
  completedLocationAt: null,
  completedNotificationsAt: null,
  skippedLocationAt: null,
  skippedNotificationsAt: null,
  dismissedAt: null,
};

function mapRow(row: OnboardingRow): OnboardingProgress {
  return {
    completedPlantsAt: row.completed_plants_at ?? null,
    completedDevicesAt: row.completed_devices_at ?? null,
    completedLocationAt: row.completed_location_at ?? null,
    completedNotificationsAt: row.completed_notifications_at ?? null,
    skippedLocationAt: row.skipped_location_at ?? null,
    skippedNotificationsAt: row.skipped_notifications_at ?? null,
    dismissedAt: row.dismissed_at ?? null,
  };
}

function emitOnboardingChanged() {
  window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));
}

export function isOnboardingIncomplete(progress: OnboardingProgress): boolean {
  return ONBOARDING_STEPS.some((step) => !isOnboardingStepResolved(progress, step));
}

export function isOnboardingVisible(progress: OnboardingProgress): boolean {
  if (progress.dismissedAt != null) return false;
  return isOnboardingIncomplete(progress);
}

export function isOnboardingRestoreAvailable(progress: OnboardingProgress): boolean {
  if (progress.dismissedAt == null) return false;
  return ONBOARDING_STEPS.some((step) => !isOnboardingStepComplete(progress, step));
}

export function isOnboardingStepComplete(
  progress: OnboardingProgress,
  step: OnboardingStep,
): boolean {
  switch (step) {
    case "plants":
      return progress.completedPlantsAt != null;
    case "devices":
      return progress.completedDevicesAt != null;
    case "location":
      return progress.completedLocationAt != null;
    case "notifications":
      return progress.completedNotificationsAt != null;
  }
}

export function isOnboardingStepSkipped(
  progress: OnboardingProgress,
  step: OnboardingStep,
): boolean {
  if (!isSkippableOnboardingStep(step)) return false;
  switch (step) {
    case "location":
      return progress.skippedLocationAt != null;
    case "notifications":
      return progress.skippedNotificationsAt != null;
  }
}

export function isOnboardingStepResolved(
  progress: OnboardingProgress,
  step: OnboardingStep,
): boolean {
  return isOnboardingStepComplete(progress, step) || isOnboardingStepSkipped(progress, step);
}

function progressWithCompletedStep(
  progress: OnboardingProgress,
  step: OnboardingStep,
  at: string,
): OnboardingProgress {
  switch (step) {
    case "plants":
      return { ...progress, completedPlantsAt: at };
    case "devices":
      return { ...progress, completedDevicesAt: at };
    case "location":
      return { ...progress, completedLocationAt: at };
    case "notifications":
      return { ...progress, completedNotificationsAt: at };
  }
}

function progressWithSkippedStep(
  progress: OnboardingProgress,
  step: SkippableOnboardingStep,
  at: string,
): OnboardingProgress {
  switch (step) {
    case "location":
      return { ...progress, skippedLocationAt: at };
    case "notifications":
      return { ...progress, skippedNotificationsAt: at };
  }
}

function celebrateIfOnboardingFinished(before: OnboardingProgress, after: OnboardingProgress) {
  if (!isOnboardingIncomplete(before) || isOnboardingIncomplete(after)) return;

  const title = i18n.t("onboarding.complete.title");
  const message = i18n.t("onboarding.complete.message");

  notifications.show({
    color: "green",
    title,
    message,
    autoClose: 10000,
  });

  void persistOnboardingCompleteNotification(title, message).catch((err) => {
    console.error("Failed to persist onboarding complete notification:", err);
  });
}

async function persistOnboardingCompleteNotification(title: string, body: string): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase.from("notifications").insert({
    user_id: user.id,
    type: "onboardingCompleted",
    title,
    body,
    payload: { kind: "complete" },
  });

  if (error && error.code !== "23505") throw error;
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export async function fetchOnboarding(): Promise<OnboardingProgress> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("user_onboarding")
    .select(ONBOARDING_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapRow(data as OnboardingRow);

  const { error: insertError } = await supabase
    .from("user_onboarding")
    .insert({ user_id: user.id });

  if (insertError) throw insertError;
  return { ...EMPTY_ONBOARDING };
}

export async function markOnboardingStepComplete(
  step: OnboardingStep,
): Promise<OnboardingStepResult> {
  const user = await requireUser();
  const column = ONBOARDING_STEP_COLUMNS[step];
  const now = new Date().toISOString();

  const progress = await fetchOnboarding();
  const dismissed = progress.dismissedAt != null;
  if (isOnboardingStepComplete(progress, step)) {
    return { newlyCompleted: false, dismissed };
  }

  const { error } = await supabase
    .from("user_onboarding")
    .update({ [column]: now, updated_at: now })
    .eq("user_id", user.id)
    .is(column, null);

  if (error) throw error;
  emitOnboardingChanged();
  celebrateIfOnboardingFinished(progress, progressWithCompletedStep(progress, step, now));
  return { newlyCompleted: true, dismissed };
}

export async function skipOnboardingStep(step: SkippableOnboardingStep): Promise<void> {
  const user = await requireUser();
  const column = ONBOARDING_SKIP_COLUMNS[step];
  const now = new Date().toISOString();

  const progress = await fetchOnboarding();
  if (isOnboardingStepResolved(progress, step)) return;

  const { error } = await supabase
    .from("user_onboarding")
    .update({ [column]: now, updated_at: now })
    .eq("user_id", user.id)
    .is(column, null);

  if (error) throw error;
  emitOnboardingChanged();
  celebrateIfOnboardingFinished(progress, progressWithSkippedStep(progress, step, now));
}

export async function dismissOnboarding(): Promise<void> {
  const user = await requireUser();
  const now = new Date().toISOString();

  await fetchOnboarding();

  const { error } = await supabase
    .from("user_onboarding")
    .update({ dismissed_at: now, updated_at: now })
    .eq("user_id", user.id)
    .is("dismissed_at", null);

  if (error) throw error;
  emitOnboardingChanged();
}

export async function restoreOnboarding(): Promise<void> {
  const user = await requireUser();
  const now = new Date().toISOString();

  await fetchOnboarding();

  const { error } = await supabase
    .from("user_onboarding")
    .update({
      dismissed_at: null,
      skipped_location_at: null,
      skipped_notifications_at: null,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .not("dismissed_at", "is", null);

  if (error) throw error;
  emitOnboardingChanged();
}
