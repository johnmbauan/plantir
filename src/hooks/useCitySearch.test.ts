import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockSearchCities = vi.fn()

vi.mock('@/services/weatherService', () => ({
  searchCities: (...args: unknown[]) => mockSearchCities(...args),
}))

import { useCitySearch } from './useCitySearch'
import { mockGeocodingResults } from '@/test/msw/handlers'

describe('useCitySearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSearchCities.mockReset()
    mockSearchCities.mockResolvedValue(mockGeocodingResults)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces search until typing pauses', async () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.setSearchQuery('R')
      result.current.setSearchQuery('Ro')
      result.current.setSearchQuery('Rom')
    })

    expect(mockSearchCities).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    expect(mockSearchCities).toHaveBeenCalledTimes(1)
    expect(mockSearchCities).toHaveBeenCalledWith('Rom')
    expect(result.current.searchResults).toEqual(mockGeocodingResults)
    expect(result.current.searching).toBe(false)
  })

  it('clears results when the query becomes empty', async () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.setSearchQuery('Rome')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })
    expect(result.current.searchResults).toEqual(mockGeocodingResults)

    act(() => {
      result.current.setSearchQuery('')
    })

    expect(result.current.searchResults).toEqual([])
    expect(result.current.noResults).toBe(false)
    expect(mockSearchCities).toHaveBeenCalledTimes(1)
  })

  it('sets noResults when search returns an empty list', async () => {
    mockSearchCities.mockResolvedValue([])

    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.setSearchQuery('Nowhere')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    expect(result.current.searchResults).toEqual([])
    expect(result.current.noResults).toBe(true)
  })

  it('searches immediately via handleSearch', async () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.setSearchQuery('Rome')
    })
    await act(async () => {
      result.current.handleSearch()
      await Promise.resolve()
    })

    expect(mockSearchCities).toHaveBeenCalledWith('Rome')
    expect(result.current.searchResults).toEqual(mockGeocodingResults)
  })

  it('resetSearch clears query and results', async () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.setSearchQuery('Rome')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    act(() => {
      result.current.resetSearch()
    })

    expect(result.current.searchQuery).toBe('')
    expect(result.current.searchResults).toEqual([])
    expect(result.current.noResults).toBe(false)
  })
})
