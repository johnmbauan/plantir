import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { AdminDevice, AdminDevicesQuery } from '@/admin/adminService';
import { ADMIN_PAGE_SIZE } from '@/admin/constants';

const mockFetchAdminDevicesPage = vi.fn();

vi.mock('@/admin/adminService', () => ({
  fetchAdminDevicesPage: (...args: unknown[]) => mockFetchAdminDevicesPage(...args),
}));

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

import { useAdminDevicesPage } from './useAdminDevicesPage';

const devices: AdminDevice[] = [
  {
    id: 1,
    serialNumber: 'SN-1',
    type: 'humidity',
    user_id: 'user-1',
    owner_email: 'owner@example.com',
    plantName: 'Monstera',
    lastHumidity: 42,
    lastBattery: 90,
    lastSeenAt: '2026-07-06T10:00:00Z',
    firmwareVersion: null,
    firmwareBoard: null,
    firmwareReportedAt: null,
    firmwareOverrideReleaseId: null,
    firmwareOverrideVersion: null,
  },
];

const baseQuery: AdminDevicesQuery = {
  serialNumber: null,
  ownerEmail: null,
  plantName: null,
  sortKey: 'lastSeenAt',
  sortDir: 'desc',
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
};

describe('useAdminDevicesPage', () => {
  beforeEach(() => {
    mockFetchAdminDevicesPage.mockReset();
    mockNotificationsShow.mockReset();
  });

  it('loads devices on mount', async () => {
    mockFetchAdminDevicesPage.mockResolvedValue({ items: devices, totalCount: 1 });

    const { result } = renderHook(() => useAdminDevicesPage(baseQuery));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(devices);
    expect(result.current.totalCount).toBe(1);
    expect(mockFetchAdminDevicesPage).toHaveBeenCalledWith(baseQuery);
  });

  it('refetches when query changes', async () => {
    mockFetchAdminDevicesPage.mockResolvedValue({ items: devices, totalCount: 60 });

    const { result, rerender } = renderHook(
      ({ query }: { query: AdminDevicesQuery }) => useAdminDevicesPage(query),
      { initialProps: { query: baseQuery } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const nextQuery = { ...baseQuery, page: 2 };
    mockFetchAdminDevicesPage.mockResolvedValue({ items: [], totalCount: 60 });

    rerender({ query: nextQuery });
    await waitFor(() => expect(result.current.totalCount).toBe(60));
    expect(mockFetchAdminDevicesPage).toHaveBeenLastCalledWith(nextQuery);
  });

  it('refresh reloads the current page', async () => {
    mockFetchAdminDevicesPage.mockResolvedValue({ items: devices, totalCount: 1 });

    const { result } = renderHook(() => useAdminDevicesPage(baseQuery));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = [{ ...devices[0], lastHumidity: 30 }];
    mockFetchAdminDevicesPage.mockResolvedValue({ items: updated, totalCount: 1 });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.items).toEqual(updated);
    expect(mockFetchAdminDevicesPage).toHaveBeenCalledTimes(2);
  });

  it('shows an error notification when fetch fails', async () => {
    mockFetchAdminDevicesPage.mockRejectedValue(new Error('forbidden'));

    const { result } = renderHook(() => useAdminDevicesPage(baseQuery));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        title: 'Error loading sensors',
        message: 'forbidden',
      }),
    );
  });

  it('ignores stale responses when the query changes quickly', async () => {
    let resolveFirst: (value: { items: AdminDevice[]; totalCount: number }) => void;
    const firstPromise = new Promise<{ items: AdminDevice[]; totalCount: number }>((resolve) => {
      resolveFirst = resolve;
    });

    mockFetchAdminDevicesPage
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ items: [], totalCount: 50 });

    const { result, rerender } = renderHook(
      ({ query }: { query: AdminDevicesQuery }) => useAdminDevicesPage(query),
      { initialProps: { query: baseQuery } },
    );

    rerender({ query: { ...baseQuery, page: 2 } });
    await waitFor(() => expect(result.current.totalCount).toBe(50));

    resolveFirst!({ items: devices, totalCount: 1 });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalCount).toBe(50);
    expect(result.current.items).toEqual([]);
  });

  it('clears stale rows when a refetch fails', async () => {
    mockFetchAdminDevicesPage.mockResolvedValueOnce({ items: devices, totalCount: 1 });

    const { result, rerender } = renderHook(
      ({ query }: { query: AdminDevicesQuery }) => useAdminDevicesPage(query),
      { initialProps: { query: baseQuery } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchAdminDevicesPage.mockRejectedValueOnce(new Error('timeout'));
    rerender({ query: { ...baseQuery, page: 2 } });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('clamps the requested page to the available total pages', async () => {
    mockFetchAdminDevicesPage.mockResolvedValue({ items: devices, totalCount: 10 });

    renderHook(() => useAdminDevicesPage({ ...baseQuery, page: 3 }));
    await waitFor(() => expect(mockFetchAdminDevicesPage).toHaveBeenCalled());

    expect(mockFetchAdminDevicesPage).toHaveBeenCalledWith({
      ...baseQuery,
      page: 1,
    });
  });
});
