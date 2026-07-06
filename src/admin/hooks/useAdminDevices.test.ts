import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { AdminDevice } from '@/admin/adminService'

const mockFetchAdminDevices = vi.fn()

vi.mock('@/admin/adminService', () => ({
  fetchAdminDevices: (...args: unknown[]) => mockFetchAdminDevices(...args),
}))

const mockNotificationsShow = vi.fn()

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}))

import { useAdminDevices } from './useAdminDevices'

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
  },
]

describe('useAdminDevices', () => {
  beforeEach(() => {
    mockFetchAdminDevices.mockReset()
    mockNotificationsShow.mockReset()
  })

  it('loads devices on mount', async () => {
    mockFetchAdminDevices.mockResolvedValue(devices)

    const { result } = renderHook(() => useAdminDevices())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.devices).toEqual(devices)
    expect(mockFetchAdminDevices).toHaveBeenCalledTimes(1)
  })

  it('refresh reloads devices', async () => {
    mockFetchAdminDevices.mockResolvedValue(devices)

    const { result } = renderHook(() => useAdminDevices())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const updated = [{ ...devices[0], lastHumidity: 30 }]
    mockFetchAdminDevices.mockResolvedValue(updated)

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.devices).toEqual(updated)
    expect(mockFetchAdminDevices).toHaveBeenCalledTimes(2)
  })

  it('shows an error notification when fetch fails', async () => {
    mockFetchAdminDevices.mockRejectedValue(new Error('forbidden'))

    const { result } = renderHook(() => useAdminDevices())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.devices).toEqual([])
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        title: 'Error loading devices',
        message: 'forbidden',
      }),
    )
  })
})
