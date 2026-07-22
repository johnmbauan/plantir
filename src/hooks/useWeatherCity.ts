import { useState, useEffect, useCallback } from "react";
import type { GeocodingResult, WeatherForecast } from "@/services/weatherService";
import { getWeatherForecast } from "@/services/weatherService";
import type { StoredCity, LocationSource } from "@/components/WeatherWidget/types";
import { recordClientEvent, showUnlockToasts } from "@/services/achievementService";
import { updateWeatherLocation } from "@/services/notificationService";

export const WEATHER_CITY_STORAGE_KEY = "weather_city";

interface UseWeatherCityReturn {
  city: StoredCity | null;
  locationSource: LocationSource;
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string | null;
  selectCity: (result: GeocodingResult) => void;
}

export function useWeatherCity(): UseWeatherCityReturn {
  const [city, setCity] = useState<StoredCity | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForecast = useCallback(async (c: StoredCity) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherForecast(c.lat, c.lng);
      setForecast(data);
    } catch {
      setError("Could not load forecast.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(WEATHER_CITY_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StoredCity;
      // Restore persisted city and load forecast on initial mount.

      setCity(parsed);
      setLocationSource("stored");
      void loadForecast(parsed);
      // Keep server-side weather coords in sync for rain-aware alerts.
      void updateWeatherLocation(parsed.lat, parsed.lng).catch((err) =>
        console.error("Failed to sync weather location:", err),
      );
    } catch {
      localStorage.removeItem(WEATHER_CITY_STORAGE_KEY);
    }
  }, [loadForecast]);

  const selectCity = useCallback(
    (result: GeocodingResult) => {
      const nameParts = [result.name, result.admin1, result.country].filter(Boolean);
      const newCity: StoredCity = {
        name: nameParts.join(", "),
        lat: result.latitude,
        lng: result.longitude,
      };
      setCity(newCity);
      setLocationSource("manual");
      localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify(newCity));
      void loadForecast(newCity);
      void updateWeatherLocation(newCity.lat, newCity.lng).catch((err) =>
        console.error("Failed to sync weather location:", err),
      );
      void recordClientEvent("weather_city_set")
        .then((newly) => showUnlockToasts(newly))
        .catch((err) => console.error("Weather achievement event failed:", err));
    },
    [loadForecast],
  );

  return { city, locationSource, forecast, loading, error, selectCity };
}
