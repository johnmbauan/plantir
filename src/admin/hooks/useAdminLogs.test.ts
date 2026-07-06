import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { AdminLog } from '@/admin/adminService'

const mockFetchAdminLogs = vi.fn()

vi.mock('@/admin/adminService', () => ({
  fetchAdminLogs: (...args: unknown[]) => mockFetchAdminLogs(...args),
}))

const mockNotificationsShow = vi.fn()

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}))

import { useAdminLogs } from './useAdminLogs'

const logs: AdminLog[] = [
  {
    id: 1,
    serialNumber: 'SN-1',
    level: 'info',
    message: 'Device online',
    createdAt: '2026-07-06T10:00:00Z',
  },
]

describe('useAdminLogs', () => {
  beforeEach(() => {
    mockFetchAdminLogs.mockReset()
    mockNotificationsShow.mockReset()
  })

  it('loads logs on mount', async () => {
    mockFetchAdminLogs.mockResolvedValue(logs)

    const { result } = renderHook(() => useAdminLogs(null))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.logs).toEqual(logs)
    expect(mockFetchAdminLogs).toHaveBeenCalledWith(undefined)
  })

  it('passes serial number filter to the service', async () => {
    mockFetchAdminLogs.mockResolvedValue([])

    const { result } = renderHook(({ serial }) => useAdminLogs(serial), {
      initialProps: { serial: 'SN-99' },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockFetchAdminLogs).toHaveBeenCalledWith('SN-99')
  })

  it('refetches when serial number changes', async () => {
    mockFetchAdminLogs.mockResolvedValue(logs)

    const { result, rerender } = renderHook(({ serial }) => useAdminLogs(serial), {
      initialProps: { serial: null as string | null },
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    const filtered = [{ ...logs[0], serialNumber: 'SN-99' }]
    mockFetchAdminLogs.mockResolvedValue(filtered)

    rerender({ serial: 'SN-99' })
    await waitFor(() => expect(result.current.logs).toEqual(filtered))
    expect(mockFetchAdminLogs).toHaveBeenLastCalledWith('SN-99')
  })

  it('refresh reloads logs', async () => {
    mockFetchAdminLogs.mockResolvedValue(logs)

    const { result } = renderHook(() => useAdminLogs('SN-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const updated = [{ ...logs[0], message: 'Device offline' }]
    mockFetchAdminLogs.mockResolvedValue(updated)

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.logs).toEqual(updated)
    expect(mockFetchAdminLogs).toHaveBeenCalledTimes(2)
  })

  it('shows an error notification when fetch fails', async () => {
    mockFetchAdminLogs.mockRejectedValue(new Error('db error'))

    const { result } = renderHook(() => useAdminLogs(null))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.logs).toEqual([])
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        title: 'Error loading logs',
        message: 'db error',
      }),
    )
  })
})
