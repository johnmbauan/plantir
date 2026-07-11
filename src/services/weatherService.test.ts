import { describe, it, expect } from 'vitest';
import { searchCities, getWeatherForecast, reverseGeocode } from './weatherService';
import { mockGeocodingResults, mockForecastResponse } from '@/test/msw/handlers';

describe('weatherService', () => {
  describe('searchCities', () => {
    it('returns geocoding results for a city name', async () => {
      const results = await searchCities('Rome');
      expect(results).toEqual(mockGeocodingResults);
    });
  });

  describe('getWeatherForecast', () => {
    it('maps forecast API response to day forecasts', async () => {
      const forecast = await getWeatherForecast(41.89, 12.49);
      expect(forecast).toHaveLength(mockForecastResponse.daily.time.length);
      expect(forecast[0]).toEqual({
        date: '2026-07-06',
        maxTemp: Math.round(mockForecastResponse.daily.temperature_2m_max[0]),
        minTemp: Math.round(mockForecastResponse.daily.temperature_2m_min[0]),
        weatherCode: mockForecastResponse.daily.weather_code[0],
      });
    });
  });

  describe('reverseGeocode', () => {
    it('returns the city name from reverse geocoding', async () => {
      await expect(reverseGeocode(41.89, 12.49)).resolves.toBe('Rome');
    });
  });
});
