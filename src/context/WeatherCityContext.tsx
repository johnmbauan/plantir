import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { GeocodingResult, WeatherForecast } from "@/services/weatherService";
import { getWeatherForecast, reverseGeocode } from "@/services/weatherService";
import type { StoredCity, LocationSource } from "@/components/WeatherWidget/types";
import { recordClientEvent, showUnlockToasts } from "@/services/achievementService";
import { fetchSettings, updateWeatherLocation } from "@/services/notificationService";
import { markOnboardingStepComplete } from "@/services/onboardingService";
import { useAuth } from "@/context/AuthContext";

export const WEATHER_CITY_STORAGE_KEY = "weather_city";

interface WeatherCityContextValue {
  city: StoredCity | null;
  locationSource: LocationSource;
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string | null;
  /** False until local + account weather location have been considered. */
  ready: boolean;
  selectCity: (result: GeocodingResult) => void;
  /** Load forecast for the current city. Safe to call from weather UI only. */
  ensureForecast: () => void;
}

const WeatherCityContext = createContext<WeatherCityContextValue | null>(null);

function cityKey(city: StoredCity): string {
  return `${city.lat},${city.lng}`;
}

function sameCoords(a: StoredCity, lat: number, lng: number): boolean {
  return a.lat === lat && a.lng === lng;
}

function readStoredCity(): StoredCity | null {
  const stored = localStorage.getItem(WEATHER_CITY_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StoredCity;
  } catch {
    localStorage.removeItem(WEATHER_CITY_STORAGE_KEY);
    return null;
  }
}

function persistCity(city: StoredCity) {
  localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify(city));
}

export function WeatherCityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [city, setCity] = useState<StoredCity | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>("none");
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
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
    const localCity = readStoredCity();
    if (localCity) {
      setCity(localCity);
      setLocationSource("stored");
    } else {
      setCity(null);
      setLocationSource("none");
    }

    if (!user) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    async function hydrateFromAccount(cached: StoredCity | null) {
      try {
        const settings = await fetchSettings();
        if (cancelled) return;

        const lat = settings?.weather_lat ?? null;
        const lng = settings?.weather_lng ?? null;

        if (lat != null && lng != null) {
          let name = cached && sameCoords(cached, lat, lng) ? cached.name : null;
          if (!name) {
            try {
              name = await reverseGeocode(lat, lng);
            } catch {
              name = cached?.name ?? "My Location";
            }
          }
          if (cancelled) return;

          const serverCity: StoredCity = { name, lat, lng };
          setCity(serverCity);
          setLocationSource("stored");
          persistCity(serverCity);

        } else if (cached) {
          void updateWeatherLocation(cached.lat, cached.lng).catch((err) =>
            console.error("Failed to sync weather location:", err),
          );
        }
      } catch (err) {
        console.error("Failed to load weather location:", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void hydrateFromAccount(localCity);
    return () => {
      cancelled = true;
    };
  }, [user]);

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
      persistCity(newCity);
      forecastAttemptKeyRef.current = cityKey(newCity);
      void loadForecast(newCity);
      void updateWeatherLocation(newCity.lat, newCity.lng).catch((err) =>
        console.error("Failed to sync weather location:", err),
      );
      void recordClientEvent("weather_city_set")
        .then((newly) => showUnlockToasts(newly))
        .catch((err) => console.error("Weather achievement event failed:", err));
      void markOnboardingStepComplete("location").catch((err) =>
        console.error("Failed to record onboarding location step:", err),
      );
    },
    [loadForecast],
  );

  return (
    <WeatherCityContext.Provider
      value={{ city, locationSource, forecast, loading, error, ready, selectCity, ensureForecast }}
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
