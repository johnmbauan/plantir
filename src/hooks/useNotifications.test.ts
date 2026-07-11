import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import type { AppNotification } from '@/services/notificationService';

const mockFetchUnreadNotifications = vi.fn();

vi.mock('@/services/notificationService', () => ({
  fetchUnreadNotifications: (...args: unknown[]) => mockFetchUnreadNotifications(...args),
}));

const mockUseAuth = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

import { useNotifications } from './useNotifications';

const wateringNotification: AppNotification = {
  id: 'n-1',
  type: 'watering',
  title: 'Water Monstera',
  body: 'Humidity is low',
  payload: { plantId: 1, plantName: 'Monstera', humidity: 10, imageUrl: null },
  created_at: '2026-07-06T08:00:00Z',
};

type BroadcastHandler = (message: { payload: AppNotification }) => void
type SubscribeCallback = (status: string) => void

let broadcastHandler: BroadcastHandler | undefined;
let subscribeCallback: SubscribeCallback | undefined;

function setupChannelMock() {
  broadcastHandler = undefined;
  subscribeCallback = undefined;

  vi.mocked(supabaseMock.channel).mockImplementation(() => {
    const chain = {
      on: vi.fn((event: string, _config: unknown, handler: BroadcastHandler) => {
        if (event === 'broadcast') broadcastHandler = handler;
        return chain;
      }),
      subscribe: vi.fn((cb?: SubscribeCallback) => {
        subscribeCallback = cb;
        cb?.('SUBSCRIBED');
        return 'channel';
      }),
    };
    return chain;
  });
}

describe('useNotifications', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    setupChannelMock();
    mockFetchUnreadNotifications.mockReset();
    mockUseAuth.mockReset();
    mockNotificationsShow.mockReset();
  });

  it('clears items when there is no session', async () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(mockFetchUnreadNotifications).not.toHaveBeenCalled();
  });

  it('loads unread notifications when session is present', async () => {
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchUnreadNotifications.mockResolvedValue([wateringNotification]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toEqual([wateringNotification]));
    expect(result.current.loading).toBe(false);
    expect(result.current.unreadCount).toBe(1);
    expect(mockFetchUnreadNotifications).toHaveBeenCalledTimes(1);
  });

  it('refresh without session clears items', async () => {
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchUnreadNotifications.mockResolvedValue([wateringNotification]);

    const { result, rerender } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    mockUseAuth.mockReturnValue({ session: null, loading: false });
    rerender();
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockFetchUnreadNotifications).toHaveBeenCalledTimes(1);
  });

  it('removeItem drops a notification by id', async () => {
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchUnreadNotifications.mockResolvedValue([wateringNotification]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => {
      result.current.removeItem('n-1');
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('adds incoming broadcast notifications and deduplicates by id', async () => {
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchUnreadNotifications.mockResolvedValue([]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const incoming: AppNotification = {
      ...wateringNotification,
      id: 'n-broadcast',
    };

    act(() => {
      broadcastHandler?.({ payload: incoming });
    });

    expect(result.current.items).toEqual([incoming]);

    act(() => {
      broadcastHandler?.({ payload: incoming });
    });

    expect(result.current.items).toHaveLength(1);
  });

  it('shows toast for incoming notification when document has focus', async () => {
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchUnreadNotifications.mockResolvedValue([]);
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      broadcastHandler?.({ payload: wateringNotification });
    });

    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Water Monstera', color: 'yellow' }),
    );

    vi.mocked(document.hasFocus).mockRestore();
  });

  it('clearAll removes all items', async () => {
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchUnreadNotifications.mockResolvedValue([wateringNotification]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('polls when realtime channel errors', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
      mockFetchUnreadNotifications.mockResolvedValue([]);

      renderHook(() => useNotifications());
      await waitFor(() => expect(mockFetchUnreadNotifications).toHaveBeenCalledTimes(1));

      act(() => {
        subscribeCallback?.('CHANNEL_ERROR');
      });

      mockFetchUnreadNotifications.mockResolvedValue([wateringNotification]);

      await act(async () => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });

      await waitFor(() => expect(mockFetchUnreadNotifications).toHaveBeenCalledTimes(2));
    } finally {
      vi.useRealTimers();
    }
  });
});
