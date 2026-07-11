import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { AdminLog, AdminLogsQuery } from '@/admin/adminService'
import { ADMIN_PAGE_SIZE } from '@/admin/constants'

const mockFetchAdminLogsPage = vi.fn()

vi.mock('@/admin/adminService', () => ({
  fetchAdminLogsPage: (...args: unknown[]) => mockFetchAdminLogsPage(...args),
}))

const mockNotificationsShow = vi.fn()

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}))

import { useAdminLogsPage } from './useAdminLogsPage'

const logs: AdminLog[] = [
  {
    id: 1,
    serialNumber: 'SN-1',
    level: 'info',
    message: 'Device online',
    createdAt: '2026-07-06T10:00:00Z',
  },
]

const baseQuery: AdminLogsQuery = {
  serialNumber: null,
  ownerEmail: null,
  level: null,
  sortKey: 'createdAt',
  sortDir: 'desc',
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
}

describe('useAdminLogsPage', () => {
  beforeEach(() => {
    mockFetchAdminLogsPage.mockReset()
    mockNotificationsShow.mockReset()
  })

  it('loads logs on mount', async () => {
    mockFetchAdminLogsPage.mockResolvedValue({ items: logs, totalCount: 1 })

    const { result } = renderHook(() => useAdminLogsPage(baseQuery))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual(logs)
    expect(result.current.totalCount).toBe(1)
    expect(mockFetchAdminLogsPage).toHaveBeenCalledWith(baseQuery)
  })

  it('refetches when query changes', async () => {
    mockFetchAdminLogsPage.mockResolvedValue({ items: logs, totalCount: 1 })

    const { result, rerender } = renderHook(
      ({ query }: { query: AdminLogsQuery }) => useAdminLogsPage(query),
      { initialProps: { query: baseQuery } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    const nextQuery = { ...baseQuery, serialNumber: 'SN-99' }
    mockFetchAdminLogsPage.mockResolvedValue({ items: [], totalCount: 0 })

    rerender({ query: nextQuery })
    await waitFor(() => expect(result.current.totalCount).toBe(0))
    expect(mockFetchAdminLogsPage).toHaveBeenLastCalledWith(nextQuery)
  })

  it('refresh reloads the current page', async () => {
    mockFetchAdminLogsPage.mockResolvedValue({ items: logs, totalCount: 1 })

    const { result } = renderHook(() => useAdminLogsPage(baseQuery))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const updated = [{ ...logs[0], message: 'Device offline' }]
    mockFetchAdminLogsPage.mockResolvedValue({ items: updated, totalCount: 1 })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.items).toEqual(updated)
    expect(mockFetchAdminLogsPage).toHaveBeenCalledTimes(2)
  })

  it('shows an error notification when fetch fails', async () => {
    mockFetchAdminLogsPage.mockRejectedValue(new Error('db error'))

    const { result } = renderHook(() => useAdminLogsPage(baseQuery))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toEqual([])
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        title: 'Error loading logs',
        message: 'db error',
      }),
    )
  })
})
