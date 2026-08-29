import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { AuthProvider } from '@/context/AuthContext';
import {
  mockSession,
  resetSupabaseMocks,
} from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import {
  useWeatherCity,
  WEATHER_CITY_STORAGE_KEY,
  WeatherCityProvider,
} from '@/context/WeatherCityContext';
import { mockGeocodingResults, mockForecastResponse } from '@/test/msw/handlers';

const mockUpdateWeatherLocation = vi.fn().mockResolvedValue(undefined);
const mockRecordClientEvent = vi.fn().mockResolvedValue([]);
const mockShowUnlockToasts = vi.fn();

const mockFetchSettings = vi.fn().mockResolvedValue(null);

vi.mock('@/services/notificationService', () => ({
  fetchSettings: (...args: unknown[]) => mockFetchSettings(...args),
  updateWeatherLocation: (...args: unknown[]) => mockUpdateWeatherLocation(...args),
}));

vi.mock('@/services/achievementService', () => ({
  recordClientEvent: (...args: unknown[]) => mockRecordClientEvent(...args),
  showUnlockToasts: (...args: unknown[]) => mockShowUnlockToasts(...args),
}));

const STORAGE_KEY = WEATHER_CITY_STORAGE_KEY;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WeatherCityProvider>{children}</WeatherCityProvider>
    </AuthProvider>
  );
}

describe('WeatherCityContext', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSession(null);
    localStorage.clear();
    mockFetchSettings.mockReset();
    mockFetchSettings.mockResolvedValue(null);
    mockUpdateWeatherLocation.mockClear();
    mockRecordClientEvent.mockClear();
    mockShowUnlockToasts.mockClear();
    mockRecordClientEvent.mockResolvedValue([]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores city from localStorage without loading forecast until ensured', async () => {
    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity));

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(result.current.city).toEqual(storedCity));
    expect(result.current.locationSource).toBe('stored');
    expect(result.current.forecast).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockUpdateWeatherLocation).not.toHaveBeenCalled();
    expect(mockRecordClientEvent).not.toHaveBeenCalled();

    act(() => {
      result.current.ensureForecast();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.forecast).toHaveLength(mockForecastResponse.daily.time.length);
    expect(result.current.error).toBeNull();
  });

  it('selectCity syncs weather location and records weather_city_set without notification_settings_saved', async () => {
    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    act(() => {
      result.current.selectCity(mockGeocodingResults[0]);
    });

    const expectedCity = {
      name: 'Rome, Lazio, Italy',
      lat: 41.89,
      lng: 12.49,
    };

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.city).toEqual(expectedCity);
    expect(result.current.locationSource).toBe('manual');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(expectedCity);
    expect(result.current.forecast).toHaveLength(mockForecastResponse.daily.time.length);
    expect(result.current.forecast![0]).toEqual({
      date: '2026-07-06',
      maxTemp: Math.round(mockForecastResponse.daily.temperature_2m_max[0]),
      minTemp: Math.round(mockForecastResponse.daily.temperature_2m_min[0]),
      weatherCode: mockForecastResponse.daily.weather_code[0],
    });
    expect(mockUpdateWeatherLocation).toHaveBeenCalledWith(41.89, 12.49);
    expect(mockRecordClientEvent).toHaveBeenCalledWith('weather_city_set');
    expect(mockRecordClientEvent).not.toHaveBeenCalledWith('notification_settings_saved');
    expect(mockShowUnlockToasts).toHaveBeenCalled();
  });

  it('starts with no city when localStorage is empty', () => {
    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    expect(result.current.city).toBeNull();
    expect(result.current.locationSource).toBe('none');
    expect(result.current.forecast).toBeNull();
  });

  it('removes invalid localStorage entry and starts fresh', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => {
      expect(result.current.city).toBeNull();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('sets error when forecast fetch fails', async () => {
    server.use(
      http.get('https://api.open-meteo.com/v1/forecast', () => HttpResponse.error()),
    );

    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity));

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(result.current.city).toEqual(storedCity));

    act(() => {
      result.current.ensureForecast();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Could not load forecast.');
    expect(result.current.forecast).toBeNull();
  });

  it('does not fetch forecast when ensureForecast is called without a city', () => {
    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    act(() => {
      result.current.ensureForecast();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.forecast).toBeNull();
  });

  it('loads forecast only once for the same city', async () => {
    let forecastCalls = 0;
    server.use(
      http.get('https://api.open-meteo.com/v1/forecast', () => {
        forecastCalls += 1;
        return HttpResponse.json(mockForecastResponse);
      }),
    );

    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity));

    const { result } = renderHook(() => useWeatherCity(), { wrapper });
    await waitFor(() => expect(result.current.city).toEqual(storedCity));

    act(() => {
      result.current.ensureForecast();
      result.current.ensureForecast();
    });

    await waitFor(() => expect(result.current.forecast).not.toBeNull());
    expect(forecastCalls).toBe(1);
  });

  it('logs when weather location sync fails after selectCity', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockUpdateWeatherLocation.mockRejectedValueOnce(new Error('sync failed'));

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    act(() => {
      result.current.selectCity(mockGeocodingResults[0]);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it('logs when weather achievement event fails after selectCity', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRecordClientEvent.mockRejectedValueOnce(new Error('achievement failed'));

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    act(() => {
      result.current.selectCity(mockGeocodingResults[0]);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it('throws when used outside WeatherCityProvider', () => {
    expect(() => renderHook(() => useWeatherCity())).toThrow(
      'useWeatherCity must be used within WeatherCityProvider',
    );
  });

  it('hydrates city from account coordinates when signed in', async () => {
    mockSession(buildSession());
    mockFetchSettings.mockResolvedValue({ weather_lat: 41.89, weather_lng: 12.49 });

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(result.current.city).toEqual({
      name: 'Rome',
      lat: 41.89,
      lng: 12.49,
    }));
    expect(result.current.locationSource).toBe('stored');
    expect(result.current.ready).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      name: 'Rome',
      lat: 41.89,
      lng: 12.49,
    });
  });

  it('reuses the cached city name when account coordinates match', async () => {
    mockSession(buildSession());
    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity));
    mockFetchSettings.mockResolvedValue({ weather_lat: 41.89, weather_lng: 12.49 });

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.city).toEqual(storedCity);
  });

  it('uploads a locally cached city when the account has no coordinates', async () => {
    mockSession(buildSession());
    const storedCity = { name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCity));

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(mockUpdateWeatherLocation).toHaveBeenCalledWith(41.89, 12.49));
  });

  it('falls back to a generic name when reverse geocoding fails', async () => {
    mockSession(buildSession());
    mockFetchSettings.mockResolvedValue({ weather_lat: 48.8, weather_lng: 2.3 });
    server.use(
      http.get('https://nominatim.openstreetmap.org/reverse', () => HttpResponse.error()),
    );

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(result.current.city).toEqual({
      name: 'My Location',
      lat: 48.8,
      lng: 2.3,
    }));
  });

  it('logs when loading account weather location fails', async () => {
    mockSession(buildSession());
    mockFetchSettings.mockRejectedValue(new Error('settings failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result } = renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('logs when uploading a cached city fails', async () => {
    mockSession(buildSession());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));
    mockUpdateWeatherLocation.mockRejectedValueOnce(new Error('upload failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderHook(() => useWeatherCity(), { wrapper });

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });
});
