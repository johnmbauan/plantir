import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Notifications } from '@mantine/notifications';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import NotificationBell from '@/components/NotificationBell';
import type { AppNotification } from '@/services/notificationService';

const mockRefresh = vi.fn();
const mockRemoveItem = vi.fn();
const mockClearAll = vi.fn();
const mockNotificationsShow = vi.fn();

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}));

vi.mock('@mantine/notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mantine/notifications')>();
  return {
    ...actual,
    notifications: {
      ...actual.notifications,
      show: (...args: unknown[]) => mockNotificationsShow(...args),
    },
  };
});

vi.mock('@/services/notificationService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/notificationService')>();
  return {
    ...actual,
    markNotificationRead: vi.fn().mockResolvedValue(undefined),
    markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
    getNotificationHref: vi.fn(() => '/'),
    snoozeNotification: vi.fn().mockResolvedValue(undefined),
  };
});

import {
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationHref,
  snoozeNotification,
} from '@/services/notificationService';

const mockedMarkRead = vi.mocked(markNotificationRead);
const mockedMarkAll = vi.mocked(markAllNotificationsRead);
const mockedGetHref = vi.mocked(getNotificationHref);
const mockedSnooze = vi.mocked(snoozeNotification);

import { useNotifications } from '@/hooks/useNotifications';

const sampleNotification: AppNotification = {
  id: 'n-1',
  type: 'watering',
  title: 'Monstera needs water',
  body: 'Humidity dropped below threshold.',
  payload: { plantId: 1, plantName: 'Monstera', humidity: 10, imageUrl: null },
  created_at: new Date().toISOString(),
};

function renderBell() {
  return renderWithProviders(
    <>
      <Notifications />
      <NotificationBell />
    </>,
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetHref.mockReturnValue('/?highlightPlant=1');
    vi.mocked(useNotifications).mockReturnValue({
      items: [],
      loading: false,
      unreadCount: 0,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });
  });

  it('renders notifications button', () => {
    renderBell();

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('shows unread count on the indicator', () => {
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 3,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not refresh when the menu opens and realtime is available', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('refreshes when the menu opens and realtime is unavailable', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(useNotifications).mockReturnValue({
      items: [],
      loading: false,
      unreadCount: 0,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: false,
    });
    renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows notification items in the menu', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Monstera needs water')).toBeInTheDocument();
  });

  it('marks a notification read when selected', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Monstera needs water'));

    await waitFor(() => {
      expect(mockedMarkRead).toHaveBeenCalledWith('n-1');
    });
    expect(mockRemoveItem).toHaveBeenCalledWith('n-1');
  });

  it('marks all notifications read from the menu', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByRole('button', { name: 'Mark all as read' }));

    expect(mockedMarkAll).toHaveBeenCalled();
    expect(mockClearAll).toHaveBeenCalled();
  });

  it('shows empty state when menu has no notifications', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('No new notifications')).toBeInTheDocument();
  });

  it('shows error when marking a notification read fails', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockNotificationsShow.mockClear();
    mockedMarkRead.mockRejectedValueOnce(new Error('Read failed'));

    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Monstera needs water'));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Read failed' }),
      );
    });
  });

  it('shows error when mark all read fails', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockNotificationsShow.mockClear();
    mockedMarkAll.mockRejectedValueOnce(new Error('Bulk read failed'));

    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Bulk read failed' }),
      );
    });
  });

  it('renders offline notification with fallback avatar', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const offlineNotification: AppNotification = {
      id: 'n-offline',
      type: 'offline',
      title: 'Device offline',
      body: 'Monstera sensor is offline',
      payload: { plants: [{ plantId: 1, plantName: 'Monstera', lastSeenAt: null }] },
      created_at: new Date().toISOString(),
    };

    vi.mocked(useNotifications).mockReturnValue({
      items: [offlineNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Device offline')).toBeInTheDocument();
    expect(screen.getByText('📡')).toBeInTheDocument();
  });

  it('renders achievement notification with a garden avatar', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const achievementNotification: AppNotification = {
      id: 'n-achievement',
      type: 'achievement',
      title: 'Sprout Wars',
      body: 'Create your first plant.',
      payload: { achievementKey: 'hello_my_name_is', garden_element: 'sprout' } as AppNotification['payload'],
      created_at: new Date().toISOString(),
    };

    vi.mocked(useNotifications).mockReturnValue({
      items: [achievementNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Sprout Wars')).toBeInTheDocument();
    expect(screen.getByText('🌿')).toBeInTheDocument();
  });

  it('shows 9+ label when unread count exceeds nine', () => {
    vi.mocked(useNotifications).mockReturnValue({
      items: Array.from({ length: 12 }, (_, i) => ({ ...sampleNotification, id: `n-${i}` })),
      loading: false,
      unreadCount: 12,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('shows snooze actions for watering notifications', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Snooze 24h')).toBeInTheDocument();
    expect(screen.getByText('Snooze 48h')).toBeInTheDocument();
  });

  it('snoozes a watering notification for 24 hours', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockNotificationsShow.mockClear();
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Snooze 24h'));

    await waitFor(() => {
      expect(mockedSnooze).toHaveBeenCalledWith(1, 24);
    });
    expect(mockedMarkRead).toHaveBeenCalledWith('n-1');
    expect(mockRemoveItem).toHaveBeenCalledWith('n-1');
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Snoozed',
        message: 'Watering reminders for Monstera silenced for 24h',
      }),
    );
  });

  it('does not navigate when snoozing a notification', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Snooze 48h'));

    await waitFor(() => {
      expect(mockedSnooze).toHaveBeenCalledWith(1, 48);
    });
    expect(mockedGetHref).not.toHaveBeenCalled();
  });

  it('shows error when snoozing fails', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    mockNotificationsShow.mockClear();
    mockedSnooze.mockRejectedValueOnce(new Error('Snooze failed'));
    vi.mocked(useNotifications).mockReturnValue({
      items: [sampleNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Snooze 24h'));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Snooze failed' }),
      );
    });
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  it('shows rain forecast hint when rain is expected', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const rainyNotification: AppNotification = {
      ...sampleNotification,
      payload: {
        ...sampleNotification.payload,
        rain_forecasted: true,
      },
    };
    vi.mocked(useNotifications).mockReturnValue({
      items: [rainyNotification],
      loading: false,
      unreadCount: 1,
      refresh: mockRefresh,
      removeItem: mockRemoveItem,
      clearAll: mockClearAll,
      realtimeAvailable: true,
    });

    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByText('Rain expected — watering may not be needed.')).toBeInTheDocument();
  });
});
