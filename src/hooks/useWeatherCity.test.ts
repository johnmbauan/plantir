import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { useWeatherCity } from './useWeatherCity'
import { mockGeocodingResults, mockForecastResponse } from '@/test/msw/handlers'

const STORAGE_KEY = 'weather_city'

describe('useWeatherCity', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('restores city from localStorage and loads forecast', async () => {
    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity))

    const { result } = renderHook(() => useWeatherCity())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.city).toEqual(storedCity)
    expect(result.current.locationSource).toBe('stored')
    expect(result.current.forecast).toHaveLength(mockForecastResponse.daily.time.length)
    expect(result.current.error).toBeNull()
  })

  it('selectCity persists to localStorage and loads forecast', async () => {
    const { result } = renderHook(() => useWeatherCity())

    act(() => {
      result.current.selectCity(mockGeocodingResults[0])
    })

    const expectedCity = {
      name: 'Rome, Lazio, Italy',
      lat: 41.89,
      lng: 12.49,
    }

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.city).toEqual(expectedCity)
    expect(result.current.locationSource).toBe('manual')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(expectedCity)
    expect(result.current.forecast).toHaveLength(mockForecastResponse.daily.time.length)
    expect(result.current.forecast![0]).toEqual({
      date: '2026-07-06',
      maxTemp: Math.round(mockForecastResponse.daily.temperature_2m_max[0]),
      minTemp: Math.round(mockForecastResponse.daily.temperature_2m_min[0]),
      weatherCode: mockForecastResponse.daily.weather_code[0],
    })
  })

  it('starts with no city when localStorage is empty', () => {
    const { result } = renderHook(() => useWeatherCity())

    expect(result.current.city).toBeNull()
    expect(result.current.locationSource).toBe('none')
    expect(result.current.forecast).toBeNull()
  })

  it('removes invalid localStorage entry and starts fresh', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')

    const { result } = renderHook(() => useWeatherCity())

    expect(result.current.city).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('sets error when forecast fetch fails', async () => {
    server.use(
      http.get('https://api.open-meteo.com/v1/forecast', () => HttpResponse.error()),
    )

    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity))

    const { result } = renderHook(() => useWeatherCity())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Could not load forecast.')
    expect(result.current.forecast).toBeNull()
  })
})
