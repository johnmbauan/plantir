import { afterEach, describe, it, expect } from 'vitest';
import i18n from '@/i18n';
import type { AppNotification } from '@/services/notificationService';
import { formatNotificationCopy } from '@/utils/notificationDisplay';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

function wateringNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'n-water',
    type: 'watering',
    title: 'stored title',
    body: 'stored body',
    payload: { plantId: 1, plantName: 'Monstera', humidity: 18, imageUrl: null },
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function offlineNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'n-offline',
    type: 'offline',
    title: 'stored title',
    body: 'stored body',
    payload: {
      plants: [{ plantId: 1, plantName: 'Monstera', lastSeenAt: null }],
    },
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('formatNotificationCopy', () => {
  describe('watering', () => {
    it('builds English watering copy from the payload', () => {
      expect(formatNotificationCopy(wateringNotification())).toEqual({
        title: 'Monstera needs water',
        body: 'Humidity reading: 18%',
      });
    });

    it('appends the rain note when rain is forecast', () => {
      expect(
        formatNotificationCopy(
          wateringNotification({
            payload: {
              plantId: 1,
              plantName: 'Monstera',
              humidity: 18,
              imageUrl: null,
              rain_forecasted: true,
            },
          }),
        ),
      ).toEqual({
        title: 'Monstera needs water',
        body: 'Humidity reading: 18%\nRain expected — watering may not be needed.',
      });
    });

    it('builds Italian watering copy after the language changes', async () => {
      await i18n.changeLanguage('it');

      expect(formatNotificationCopy(wateringNotification())).toEqual({
        title: 'Monstera ha bisogno di acqua',
        body: 'Umidità: 18%',
      });
    });
  });

  describe('offline', () => {
    it('builds a single-plant title and never-seen line', () => {
      expect(formatNotificationCopy(offlineNotification())).toEqual({
        title: 'Monstera is offline',
        body: "The following plants haven't sent data in too long:\n\n• Monstera (never seen)",
      });
    });

    it('builds a multi-plant title and last-reading line in the given timezone', () => {
      const lastSeenAt = '2024-01-01T12:00:00Z';
      const time = new Date(lastSeenAt).toLocaleString('en-US', { timeZone: 'UTC' });

      expect(
        formatNotificationCopy(
          offlineNotification({
            payload: {
              plants: [
                { plantId: 1, plantName: 'Monstera', lastSeenAt },
                { plantId: 2, plantName: 'Fern', lastSeenAt: null },
              ],
              notificationTimezone: 'UTC',
            },
          }),
        ),
      ).toEqual({
        title: '2 devices offline',
        body:
          "The following plants haven't sent data in too long:\n\n"
          + `• Monstera (last reading ${time})\n`
          + '• Fern (never seen)',
      });
    });

    it('formats last-seen times with the Italian locale', async () => {
      await i18n.changeLanguage('it');
      const lastSeenAt = '2024-01-01T12:00:00Z';
      const time = new Date(lastSeenAt).toLocaleString('it-IT');

      const { title, body } = formatNotificationCopy(
        offlineNotification({
          payload: {
            plants: [{ plantId: 1, plantName: 'Monstera', lastSeenAt }],
          },
        }),
      );

      expect(title).toBe('Monstera è offline');
      expect(body).toBe(
        `Le seguenti piante non inviano dati da troppo tempo:\n\n• Monstera (ultima lettura ${time})`,
      );
    });
  });

  describe('achievement', () => {
    it('uses translated garden copy instead of the stored title and body', () => {
      expect(
        formatNotificationCopy({
          id: 'n-ach',
          type: 'achievement',
          title: 'Sprout Wars',
          body: 'Create your first plant.',
          payload: { achievementKey: 'hello_my_name_is', garden_element: 'sprout' },
          created_at: '2024-01-01T00:00:00Z',
        }),
      ).toEqual({
        title: 'Sprout Wars: A New Leaf',
        body: 'Create your first plant.',
      });
    });

    it('uses Italian garden copy after the language changes', async () => {
      await i18n.changeLanguage('it');

      expect(
        formatNotificationCopy({
          id: 'n-ach',
          type: 'achievement',
          title: 'Sprout Wars',
          body: 'Create your first plant.',
          payload: { achievementKey: 'hello_my_name_is', garden_element: 'sprout' },
          created_at: '2024-01-01T00:00:00Z',
        }),
      ).toEqual({
        title: "C'era una volta il vaso",
        body: 'Crea la tua prima pianta.',
      });
    });
  });

  describe('onboardingCompleted', () => {
    it('uses translated congratulations copy', () => {
      expect(
        formatNotificationCopy({
          id: 'n-onboard',
          type: 'onboardingCompleted',
          title: 'stored title',
          body: 'stored body',
          payload: { kind: 'complete' },
          created_at: '2024-01-01T00:00:00Z',
        }),
      ).toEqual({
        title: 'Congratulations',
        body: "You're ready to start taking care of your plants. Remember to assign the sensor to your plant (if not already done) and insert it into the soil.",
      });
    });
  });

  it('returns the stored title and body when the payload does not match the type', () => {
    expect(
      formatNotificationCopy({
        id: 'n-odd',
        type: 'achievement',
        title: 'Stored title',
        body: 'Stored body',
        payload: { plantId: 1, plantName: 'Monstera', humidity: 10, imageUrl: null },
        created_at: '2024-01-01T00:00:00Z',
      }),
    ).toEqual({
      title: 'Stored title',
      body: 'Stored body',
    });
  });
});
