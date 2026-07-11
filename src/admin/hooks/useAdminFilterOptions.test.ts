import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { AdminFilterOptions } from '@/admin/adminService'

const mockFetchAdminFilterOptions = vi.fn()

vi.mock('@/admin/adminService', () => ({
  fetchAdminFilterOptions: (...args: unknown[]) => mockFetchAdminFilterOptions(...args),
}))

const mockNotificationsShow = vi.fn()

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}))

import { useAdminFilterOptions } from './useAdminFilterOptions'

const filterOptions: AdminFilterOptions = {
  serials: ['SN-1'],
  owners: ['owner@example.com'],
  plants: ['Monstera'],
  hasUnassignedOwner: false,
  hasUnassignedPlant: false,
}

describe('useAdminFilterOptions', () => {
  beforeEach(() => {
    mockFetchAdminFilterOptions.mockReset()
    mockNotificationsShow.mockReset()
  })

  it('loads filter options on mount', async () => {
    mockFetchAdminFilterOptions.mockResolvedValue(filterOptions)

    const { result } = renderHook(() => useAdminFilterOptions())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.filterOptions).toEqual(filterOptions)
    expect(mockFetchAdminFilterOptions).toHaveBeenCalledTimes(1)
  })

  it('refresh reloads filter options', async () => {
    mockFetchAdminFilterOptions.mockResolvedValue(filterOptions)

    const { result } = renderHook(() => useAdminFilterOptions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const updated = { ...filterOptions, serials: ['SN-1', 'SN-2'] }
    mockFetchAdminFilterOptions.mockResolvedValue(updated)

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.filterOptions).toEqual(updated)
    expect(mockFetchAdminFilterOptions).toHaveBeenCalledTimes(2)
  })

  it('shows an error notification when fetch fails', async () => {
    mockFetchAdminFilterOptions.mockRejectedValue(new Error('forbidden'))

    const { result } = renderHook(() => useAdminFilterOptions())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.filterOptions).toEqual({
      serials: [],
      owners: [],
      plants: [],
      hasUnassignedOwner: false,
      hasUnassignedPlant: false,
    })
    expect(mockNotificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        title: 'Error loading filters',
        message: 'forbidden',
      }),
    )
  })
})
