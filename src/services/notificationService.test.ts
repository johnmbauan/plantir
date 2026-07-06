import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetchPlantStatusesByIds = vi.fn()

vi.mock('@/services/plantService', () => ({
  fetchPlantStatusesByIds: (...args: unknown[]) => mockFetchPlantStatusesByIds(...args),
}))

import '@/test/mocks/supabase'
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
} from '@/test/mocks/supabase'
import {
  fetchSettings,
  fetchUnreadNotifications,
  getNotificationHref,
  markNotificationRead,
  markAllNotificationsRead,
  upsertSettings,
  type AppNotification,
} from './notificationService'

const wateringNotification: AppNotification = {
  id: 'n-1',
  type: 'watering',
  title: 'Water Monstera',
  body: 'Humidity is low',
  payload: { plantId: 1, plantName: 'Monstera', humidity: 10, imageUrl: null },
  created_at: '2026-07-06T08:00:00Z',
}

describe('notificationService', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[1, ['WATERING_NEEDED']]]))
  })

  describe('fetchSettings', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated()
      await expect(fetchSettings()).rejects.toThrow('Not authenticated')
    })

    it('returns notification settings', async () => {
      mockAuthenticatedUser()
      const settings = {
        id: 1,
        telegram_chat_id: '123',
        notification_hour: 9,
        notification_timezone: 'Europe/Rome',
        browser_notifications_enabled: true,
      }
      setupFromMocks({ notification_settings: { data: settings, error: null } })
      await expect(fetchSettings()).resolves.toEqual(settings)
    })
  })

  describe('fetchUnreadNotifications', () => {
    it('returns unread notifications', async () => {
      mockAuthenticatedUser()
      setupFromMocks({
        notifications: { data: [wateringNotification], error: null },
      })
      await expect(fetchUnreadNotifications()).resolves.toEqual([wateringNotification])
    })

    it('auto-resolves notifications when plant is healthy again', async () => {
      mockAuthenticatedUser()
      mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[1, ['HEALTHY']]]))
      setupFromMocks({
        notifications: [
          { data: [wateringNotification], error: null },
          { data: null, error: null },
        ],
      })

      await expect(fetchUnreadNotifications()).resolves.toEqual([])
    })

    it('auto-resolves offline notifications when all plants are back online', async () => {
      mockAuthenticatedUser()
      const offlineNotification: AppNotification = {
        id: 'n-offline',
        type: 'offline',
        title: 'Plants offline',
        body: 'Monstera is offline',
        payload: { plants: [{ plantId: 2, plantName: 'Monstera', lastSeenAt: null }] },
        created_at: '2026-07-06T08:00:00Z',
      }
      mockFetchPlantStatusesByIds.mockResolvedValue(new Map([[2, ['HEALTHY']]]))
      setupFromMocks({
        notifications: [
          { data: [offlineNotification], error: null },
          { data: null, error: null },
        ],
      })

      await expect(fetchUnreadNotifications()).resolves.toEqual([])
    })
  })

  describe('upsertSettings', () => {
    it('upserts settings for authenticated user', async () => {
      mockAuthenticatedUser()
      setupFromMocks({ notification_settings: { data: null, error: null } })
      await expect(
        upsertSettings('chat-1', 9, 'Europe/Rome', true),
      ).resolves.toBeUndefined()
    })
  })

  describe('markAllNotificationsRead', () => {
    it('marks all unread notifications as read', async () => {
      mockAuthenticatedUser()
      setupFromMocks({ notifications: { data: null, error: null } })
      await expect(markAllNotificationsRead()).resolves.toBeUndefined()
    })
  })

  describe('getNotificationHref', () => {
    it('links watering alerts to the highlighted plant', () => {
      expect(getNotificationHref(wateringNotification)).toBe('/?highlightPlant=1')
    })

    it('links offline alerts to the devices tab', () => {
      const offline: AppNotification = {
        ...wateringNotification,
        id: 'n-2',
        type: 'offline',
        payload: { plants: [{ plantId: 1, plantName: 'Monstera', lastSeenAt: null }] },
      }
      expect(getNotificationHref(offline)).toBe('/plants-center?tab=devices')
    })
  })

  describe('markNotificationRead', () => {
    it('updates the notification read timestamp', async () => {
      setupFromMocks({ notifications: { data: null, error: null } })
      await expect(markNotificationRead('n-1')).resolves.toBeUndefined()
    })
  })
})
