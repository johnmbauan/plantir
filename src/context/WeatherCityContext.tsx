import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { GeocodingResult, WeatherForecast } from "@/services/weatherService";
import { getWeatherForecast } from "@/services/weatherService";
import type { StoredCity, LocationSource } from "@/components/WeatherWidget/types";
import { recordClientEvent, showUnlockToasts } from "@/services/achievementService";
import { updateWeatherLocation } from "@/services/notificationService";

export const WEATHER_CITY_STORAGE_KEY = "weather_city";

interface WeatherCityContextValue {
  city: StoredCity | null;
  locationSource: LocationSource;
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string | null;
  selectCity: (result: GeocodingResult) => void;
  /** Load forecast for the current city. Safe to call from weather UI only. */
  ensureForecast: () => void;
}

const WeatherCityContext = createContext<WeatherCityContextValue | null>(null);

function cityKey(city: StoredCity): string {
  return `${city.lat},${city.lng}`;
}

export function WeatherCityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<StoredCity | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const forecastAttemptKeyRef = useRef<string | null>(null);

  const loadForecast = useCallback(async (c: StoredCity) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeatherForecast(c.lat, c.lng);
      setForecast(data);
    } catch {
      setError("Could not load forecast.");
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(WEATHER_CITY_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StoredCity;
      setCity(parsed);
      setLocationSource("stored");
    } catch {
      localStorage.removeItem(WEATHER_CITY_STORAGE_KEY);
    }
  }, []);

  const ensureForecast = useCallback(() => {
    if (!city) return;
    const key = cityKey(city);
    if (forecastAttemptKeyRef.current === key) return;
    forecastAttemptKeyRef.current = key;
    void loadForecast(city);
  }, [city, loadForecast]);

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
      forecastAttemptKeyRef.current = cityKey(newCity);
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

  return (
    <WeatherCityContext.Provider
      value={{ city, locationSource, forecast, loading, error, selectCity, ensureForecast }}
    >
      {children}
    </WeatherCityContext.Provider>
  );
}

export function useWeatherCity(): WeatherCityContextValue {
  const value = useContext(WeatherCityContext);
  if (!value) {
    throw new Error("useWeatherCity must be used within WeatherCityProvider");
  }
  return value;
}
