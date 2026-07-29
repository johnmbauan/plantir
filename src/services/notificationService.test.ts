import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetchPlantStatusesByIds = vi.fn();
const mockRecordClientEvent = vi.fn();
const mockShowUnlockToasts = vi.fn();
const mockEvaluateAndToastUnlocks = vi.fn();

vi.mock('@/services/plantService', () => ({
  fetchPlantStatusesByIds: (...args: unknown[]) => mockFetchPlantStatusesByIds(...args),
}));

vi.mock('@/services/achievementService', () => ({
  recordClientEvent: (...args: unknown[]) => mockRecordClientEvent(...args),
  showUnlockToasts: (...args: unknown[]) => mockShowUnlockToasts(...args),
  evaluateAndToastUnlocks: (...args: unknown[]) => mockEvaluateAndToastUnlocks(...args),
}));

import '@/test/mocks/supabase';
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
} from '@/test/mocks/supabase';
import {
  fetchSettings,
  fetchUnreadNotifications,
  autoResolveNotifications,
  getNotificationHref,
  markNotificationRead,
  markAllNotificationsRead,
  upsertSettings,
  updateWeatherLocation,
  snoozeNotification,
  unsnoozeNotification,
  fetchActiveSnoozedPlants,
  type AppNotification,
} from './notificationService';

const wateringNotification: AppNotification = {
  id: 'n-1',
  type: 'watering',
  title: 'Water Monstera',
  body: 'Humidity is low',
  payload: { plantId: 1, plantName: 'Monstera', humidity: 10, imageUrl: null },
  created_at: '2026-07-06T08:00:00Z',
};

describe('notificationService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[1, ['WATERING_NEEDED']]]));
    mockRecordClientEvent.mockReset();
    mockShowUnlockToasts.mockReset();
    mockEvaluateAndToastUnlocks.mockReset();
    mockRecordClientEvent.mockResolvedValue([]);
    mockEvaluateAndToastUnlocks.mockResolvedValue([]);
  });

  describe('fetchSettings', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchSettings()).rejects.toThrow('Not authenticated');
    });

    it('returns notification settings', async () => {
      mockAuthenticatedUser();
      const settings = {
        id: 1,
        telegram_chat_id: '123',
        notification_hour: 9,
        notification_timezone: 'Europe/Rome',
        browser_notifications_enabled: true,
      };
      setupFromMocks({ notification_settings: { data: settings, error: null } });
      await expect(fetchSettings()).resolves.toEqual(settings);
    });
  });

  describe('fetchUnreadNotifications', () => {
    it('returns unread notifications', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        notifications: { data: [wateringNotification], error: null },
      });
      await expect(fetchUnreadNotifications()).resolves.toEqual([wateringNotification]);
    });

    it('returns unread notifications without waiting for auto-resolve', async () => {
      mockAuthenticatedUser();
      mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[1, ['HEALTHY']]]));
      setupFromMocks({
        notifications: { data: [wateringNotification], error: null },
      });

      await expect(fetchUnreadNotifications()).resolves.toEqual([wateringNotification]);
      expect(mockFetchPlantStatusesByIds).not.toHaveBeenCalled();
    });
  });

  describe('autoResolveNotifications', () => {
    it('resolves watering notifications when plant is healthy again', async () => {
      mockAuthenticatedUser();
      mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[1, ['HEALTHY']]]));
      setupFromMocks({
        notifications: { data: null, error: null },
      });

      await expect(autoResolveNotifications([wateringNotification])).resolves.toEqual([]);
      expect(mockFetchPlantStatusesByIds).toHaveBeenCalledWith([1]);
      expect(mockEvaluateAndToastUnlocks).toHaveBeenCalled();
    });

    it('resolves offline notifications when all plants are back online', async () => {
      mockAuthenticatedUser();
      const offlineNotification: AppNotification = {
        id: 'n-offline',
        type: 'offline',
        title: 'Plants offline',
        body: 'Monstera is offline',
        payload: { plants: [{ plantId: 2, plantName: 'Monstera', lastSeenAt: null }] },
        created_at: '2026-07-06T08:00:00Z',
      };
      mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[2, ['HEALTHY']]]));
      setupFromMocks({
        notifications: { data: null, error: null },
      });

      await expect(autoResolveNotifications([offlineNotification])).resolves.toEqual([]);
      expect(mockFetchPlantStatusesByIds).toHaveBeenCalledWith([2]);
    });

    it('keeps notifications that still need attention', async () => {
      mockAuthenticatedUser();
      mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[1, ['WATERING_NEEDED']]]));

      await expect(autoResolveNotifications([wateringNotification])).resolves.toEqual([
        wateringNotification,
      ]);
      expect(mockEvaluateAndToastUnlocks).not.toHaveBeenCalled();
    });
  });

  describe('upsertSettings', () => {
    it('upserts settings for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: null } });
      await expect(
        upsertSettings('chat-1', 9, 'Europe/Rome', true),
      ).resolves.toBeUndefined();
    });

    it('records notification_settings_saved and shows unlock toasts after a successful save', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: null } });
      const unlocked = [{
        key: 'plant_texted_back',
        name: 'The Pothos Always Rings Twice',
        description: 'Save notification settings or connect Telegram.',
        garden_element: 'bell_flower',
        sort_order: 50,
        is_hidden: false,
      }];
      mockRecordClientEvent.mockResolvedValue(unlocked);

      await upsertSettings('chat-1', 9, 'Europe/Rome', true);

      expect(mockRecordClientEvent).toHaveBeenCalledWith('notification_settings_saved');
      expect(mockShowUnlockToasts).toHaveBeenCalledWith(unlocked);
    });

    it('does not record an achievement event when the database upsert fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: new Error('DB error') } });

      await expect(
        upsertSettings('chat-1', 9, 'Europe/Rome', true),
      ).rejects.toThrow('DB error');

      expect(mockRecordClientEvent).not.toHaveBeenCalled();
      expect(mockShowUnlockToasts).not.toHaveBeenCalled();
    });

    it('still resolves when recording the achievement event fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: null } });
      mockRecordClientEvent.mockRejectedValue(new Error('Edge function failed'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        upsertSettings('chat-1', 9, 'Europe/Rome', true),
      ).resolves.toBeUndefined();

      expect(mockRecordClientEvent).toHaveBeenCalledWith('notification_settings_saved');
      expect(mockShowUnlockToasts).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to record notification_settings_saved achievement event:',
        expect.any(Error),
      );

      errorSpy.mockRestore();
    });
  });

  describe('markAllNotificationsRead', () => {
    it('marks all unread notifications as read', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notifications: { data: null, error: null } });
      await expect(markAllNotificationsRead()).resolves.toBeUndefined();
    });
  });

  describe('getNotificationHref', () => {
    it('links watering alerts to the highlighted plant', () => {
      expect(getNotificationHref(wateringNotification)).toBe('/?highlightPlant=1');
    });

    it('links offline alerts to the devices tab', () => {
      const offline: AppNotification = {
        ...wateringNotification,
        id: 'n-2',
        type: 'offline',
        payload: { plants: [{ plantId: 1, plantName: 'Monstera', lastSeenAt: null }] },
      };
      expect(getNotificationHref(offline)).toBe('/plants-center?tab=devices');
    });

    it('links achievement notifications to the garden section of the profile page', () => {
      const achievement: AppNotification = {
        ...wateringNotification,
        id: 'n-achievement',
        type: 'achievement',
        payload: { achievementKey: 'hello_my_name_is', garden_element: 'sprout' },
      };
      expect(getNotificationHref(achievement)).toBe('/profile#garden');
    });
  });

  describe('updateWeatherLocation', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(updateWeatherLocation(48.8, 2.3)).rejects.toThrow('Not authenticated');
    });

    it('updates weather location for the authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: null } });
      await expect(updateWeatherLocation(48.8, 2.3)).resolves.toBeUndefined();
    });

    it('does not record notification_settings_saved when syncing weather location', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: null } });

      await updateWeatherLocation(48.8, 2.3);

      expect(mockRecordClientEvent).not.toHaveBeenCalled();
      expect(mockShowUnlockToasts).not.toHaveBeenCalled();
      expect(mockEvaluateAndToastUnlocks).not.toHaveBeenCalled();
    });

    it('throws when the database update fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ notification_settings: { data: null, error: new Error('DB error') } });
      await expect(updateWeatherLocation(48.8, 2.3)).rejects.toThrow('DB error');
    });
  });

  describe('snoozeNotification', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(snoozeNotification(1, 24)).rejects.toThrow('Not authenticated');
    });

    it('upserts a snooze entry for 24 hours', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: null, error: null } });
      await expect(snoozeNotification(42, 24)).resolves.toBeUndefined();
    });

    it('upserts a snooze entry for 48 hours', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: null, error: null } });
      await expect(snoozeNotification(42, 48)).resolves.toBeUndefined();
    });

    it('throws when the database upsert fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: null, error: new Error('DB error') } });
      await expect(snoozeNotification(1, 24)).rejects.toThrow('DB error');
    });
  });

  describe('unsnoozeNotification', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(unsnoozeNotification(1)).rejects.toThrow('Not authenticated');
    });

    it('deletes the snooze record for the given plant', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: null, error: null } });
      await expect(unsnoozeNotification(42)).resolves.toBeUndefined();
    });

    it('throws when the database delete fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: null, error: new Error('DB error') } });
      await expect(unsnoozeNotification(1)).rejects.toThrow('DB error');
    });
  });

  describe('fetchActiveSnoozedPlants', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchActiveSnoozedPlants()).rejects.toThrow('Not authenticated');
    });

    it('returns a map of plant ids to snoozed_until', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plant_notification_snooze: {
          data: [
            { plant_id: 1, snoozed_until: '2026-07-23T10:00:00.000Z' },
            { plant_id: 7, snoozed_until: '2026-07-24T12:00:00.000Z' },
          ],
          error: null,
        },
      });

      await expect(fetchActiveSnoozedPlants()).resolves.toEqual(
        new Map([
          [1, '2026-07-23T10:00:00.000Z'],
          [7, '2026-07-24T12:00:00.000Z'],
        ]),
      );
    });

    it('returns an empty map when there are no active snoozes', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: [], error: null } });
      await expect(fetchActiveSnoozedPlants()).resolves.toEqual(new Map());
    });

    it('throws when the database query fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plant_notification_snooze: { data: null, error: new Error('DB error') } });
      await expect(fetchActiveSnoozedPlants()).rejects.toThrow('DB error');
    });
  });

  describe('markNotificationRead', () => {
    it('updates the notification read timestamp', async () => {
      setupFromMocks({ notifications: { data: null, error: null } });
      await expect(markNotificationRead('n-1')).resolves.toBeUndefined();
    });
  });
});
