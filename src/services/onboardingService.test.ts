import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
  mockFrom,
} from '@/test/mocks/supabase';
import {
  EMPTY_ONBOARDING,
  dismissOnboarding,
  fetchOnboarding,
  isOnboardingRestoreAvailable,
  isOnboardingStepComplete,
  isOnboardingVisible,
  markOnboardingStepComplete,
  restoreOnboarding,
  skipOnboardingStep,
} from './onboardingService';
import { ONBOARDING_CHANGED_EVENT } from '@/constants/onboarding';

const emptyRow = {
  completed_plants_at: null,
  completed_devices_at: null,
  completed_location_at: null,
  completed_notifications_at: null,
  skipped_location_at: null,
  skipped_notifications_at: null,
  dismissed_at: null,
};

describe('onboardingService helpers', () => {
  it('treats a step as complete only when that timestamp is set', () => {
    expect(isOnboardingStepComplete(EMPTY_ONBOARDING, 'plants')).toBe(false);
    expect(
      isOnboardingStepComplete({ ...EMPTY_ONBOARDING, completedPlantsAt: '2026-08-30T00:00:00Z' }, 'plants'),
    ).toBe(true);
    expect(
      isOnboardingStepComplete({ ...EMPTY_ONBOARDING, completedDevicesAt: '2026-08-30T00:00:00Z' }, 'devices'),
    ).toBe(true);
    expect(
      isOnboardingStepComplete({ ...EMPTY_ONBOARDING, completedLocationAt: '2026-08-30T00:00:00Z' }, 'location'),
    ).toBe(true);
    expect(
      isOnboardingStepComplete(
        { ...EMPTY_ONBOARDING, completedNotificationsAt: '2026-08-30T00:00:00Z' },
        'notifications',
      ),
    ).toBe(true);
  });

  it('hides onboarding when dismissed, every step is complete, or remaining steps are skipped', () => {
    expect(isOnboardingVisible(EMPTY_ONBOARDING)).toBe(true);
    expect(isOnboardingVisible({ ...EMPTY_ONBOARDING, dismissedAt: '2026-08-30T00:00:00Z' })).toBe(false);
    expect(
      isOnboardingVisible({
        ...EMPTY_ONBOARDING,
        completedPlantsAt: '2026-08-30T00:00:00Z',
        completedDevicesAt: '2026-08-30T00:00:00Z',
        completedLocationAt: '2026-08-30T00:00:00Z',
        completedNotificationsAt: '2026-08-30T00:00:00Z',
      }),
    ).toBe(false);
    expect(
      isOnboardingVisible({
        ...EMPTY_ONBOARDING,
        completedPlantsAt: '2026-08-30T00:00:00Z',
        completedDevicesAt: '2026-08-30T00:00:00Z',
        skippedLocationAt: '2026-08-30T00:00:00Z',
        skippedNotificationsAt: '2026-08-30T00:00:00Z',
      }),
    ).toBe(false);
  });

  it('offers restore only when dismissed and at least one step is still open', () => {
    expect(isOnboardingRestoreAvailable(EMPTY_ONBOARDING)).toBe(false);
    expect(isOnboardingRestoreAvailable({ ...EMPTY_ONBOARDING, dismissedAt: '2026-08-30T00:00:00Z' })).toBe(true);
    expect(
      isOnboardingRestoreAvailable({
        ...EMPTY_ONBOARDING,
        completedPlantsAt: '2026-08-30T00:00:00Z',
        completedDevicesAt: '2026-08-30T00:00:00Z',
        completedLocationAt: '2026-08-30T00:00:00Z',
        completedNotificationsAt: '2026-08-30T00:00:00Z',
        dismissedAt: '2026-08-30T00:00:00Z',
      }),
    ).toBe(false);
    expect(
      isOnboardingRestoreAvailable({
        ...EMPTY_ONBOARDING,
        completedPlantsAt: '2026-08-30T00:00:00Z',
        completedDevicesAt: '2026-08-30T00:00:00Z',
        skippedLocationAt: '2026-08-30T00:00:00Z',
        skippedNotificationsAt: '2026-08-30T00:00:00Z',
        dismissedAt: '2026-08-30T00:00:00Z',
      }),
    ).toBe(true);
  });
});

describe('onboardingService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockNotificationsShow.mockReset();
  });

  describe('fetchOnboarding', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchOnboarding()).rejects.toThrow('Not authenticated');
    });

    it('returns mapped progress when a row exists', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: {
            ...emptyRow,
            completed_plants_at: '2026-08-30T10:00:00Z',
          },
          error: null,
        },
      });

      await expect(fetchOnboarding()).resolves.toEqual({
        ...EMPTY_ONBOARDING,
        completedPlantsAt: '2026-08-30T10:00:00Z',
      });
    });

    it('creates a row when none exists', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: [
          { data: null, error: null },
          { data: null, error: null },
        ],
      });

      await expect(fetchOnboarding()).resolves.toEqual(EMPTY_ONBOARDING);
      expect(mockFrom).toHaveBeenCalledWith('user_onboarding');
    });

    it('throws when select fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: { data: null, error: new Error('Load failed') },
      });

      await expect(fetchOnboarding()).rejects.toThrow('Load failed');
    });

    it('throws when insert fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: [
          { data: null, error: null },
          { data: null, error: new Error('Insert failed') },
        ],
      });

      await expect(fetchOnboarding()).rejects.toThrow('Insert failed');
    });
  });

  describe('markOnboardingStepComplete', () => {
    it('returns newlyCompleted false when the step is already done', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: { ...emptyRow, completed_plants_at: '2026-08-01T00:00:00Z' },
          error: null,
        },
      });

      await expect(markOnboardingStepComplete('plants')).resolves.toEqual({
        newlyCompleted: false,
        dismissed: false,
      });
    });

    it('returns dismissed true when onboarding was dismissed', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: { ...emptyRow, dismissed_at: '2026-08-01T00:00:00Z' },
          error: null,
        },
      });

      await expect(markOnboardingStepComplete('devices')).resolves.toEqual({
        newlyCompleted: true,
        dismissed: true,
      });
    });

    it('marks a step and notifies listeners', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: { data: emptyRow, error: null },
      });
      const listener = vi.fn();
      window.addEventListener(ONBOARDING_CHANGED_EVENT, listener);

      await expect(markOnboardingStepComplete('location')).resolves.toEqual({
        newlyCompleted: true,
        dismissed: false,
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(mockNotificationsShow).not.toHaveBeenCalled();

      window.removeEventListener(ONBOARDING_CHANGED_EVENT, listener);
    });

    it('congratulates when the last remaining step is completed', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: {
            ...emptyRow,
            completed_plants_at: '2026-08-01T00:00:00Z',
            completed_devices_at: '2026-08-01T00:00:00Z',
            completed_location_at: '2026-08-01T00:00:00Z',
          },
          error: null,
        },
      });

      await markOnboardingStepComplete('notifications');

      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          title: 'Congratulations',
          message:
            "You're ready to start taking care of your plants. Remember to assign the sensor to your plant and insert it into the soil.",
        }),
      );
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('notifications');
      });
    });

    it('throws when update fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: [
          { data: emptyRow, error: null },
          { data: null, error: new Error('Update failed') },
        ],
      });

      await expect(markOnboardingStepComplete('notifications')).rejects.toThrow('Update failed');
    });
  });

  describe('skipOnboardingStep', () => {
    it('persists a skip and notifies listeners', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: { data: emptyRow, error: null },
      });
      const listener = vi.fn();
      window.addEventListener(ONBOARDING_CHANGED_EVENT, listener);

      await expect(skipOnboardingStep('location')).resolves.toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(mockNotificationsShow).not.toHaveBeenCalled();

      window.removeEventListener(ONBOARDING_CHANGED_EVENT, listener);
    });

    it('congratulates when skipping the last remaining optional step', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: {
            ...emptyRow,
            completed_plants_at: '2026-08-01T00:00:00Z',
            completed_devices_at: '2026-08-01T00:00:00Z',
            skipped_location_at: '2026-08-01T00:00:00Z',
          },
          error: null,
        },
      });

      await skipOnboardingStep('notifications');

      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          title: 'Congratulations',
        }),
      );
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('notifications');
      });
    });

    it('does not write when the step is already complete', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: { ...emptyRow, completed_location_at: '2026-08-01T00:00:00Z' },
          error: null,
        },
      });
      const listener = vi.fn();
      window.addEventListener(ONBOARDING_CHANGED_EVENT, listener);

      await expect(skipOnboardingStep('location')).resolves.toBeUndefined();
      expect(listener).not.toHaveBeenCalled();

      window.removeEventListener(ONBOARDING_CHANGED_EVENT, listener);
    });

    it('does not write when the step is already skipped', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: { ...emptyRow, skipped_notifications_at: '2026-08-01T00:00:00Z' },
          error: null,
        },
      });
      const listener = vi.fn();
      window.addEventListener(ONBOARDING_CHANGED_EVENT, listener);

      await expect(skipOnboardingStep('notifications')).resolves.toBeUndefined();
      expect(listener).not.toHaveBeenCalled();

      window.removeEventListener(ONBOARDING_CHANGED_EVENT, listener);
    });

    it('throws when update fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: [
          { data: emptyRow, error: null },
          { data: null, error: new Error('Skip failed') },
        ],
      });

      await expect(skipOnboardingStep('location')).rejects.toThrow('Skip failed');
    });
  });

  describe('dismissOnboarding', () => {
    it('persists dismissed_at and notifies listeners', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: { data: emptyRow, error: null },
      });
      const listener = vi.fn();
      window.addEventListener(ONBOARDING_CHANGED_EVENT, listener);

      await expect(dismissOnboarding()).resolves.toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(ONBOARDING_CHANGED_EVENT, listener);
    });

    it('throws when update fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: [
          { data: emptyRow, error: null },
          { data: null, error: new Error('Dismiss failed') },
        ],
      });

      await expect(dismissOnboarding()).rejects.toThrow('Dismiss failed');
    });
  });

  describe('restoreOnboarding', () => {
    it('clears dismissed_at and notifies listeners', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: {
          data: { ...emptyRow, dismissed_at: '2026-08-30T00:00:00Z' },
          error: null,
        },
      });
      const listener = vi.fn();
      window.addEventListener(ONBOARDING_CHANGED_EVENT, listener);

      await expect(restoreOnboarding()).resolves.toBeUndefined();
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener(ONBOARDING_CHANGED_EVENT, listener);
    });

    it('throws when update fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        user_onboarding: [
          { data: { ...emptyRow, dismissed_at: '2026-08-30T00:00:00Z' }, error: null },
          { data: null, error: new Error('Restore failed') },
        ],
      });

      await expect(restoreOnboarding()).rejects.toThrow('Restore failed');
    });
  });
});
