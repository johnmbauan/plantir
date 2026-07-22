import type { WateringRow } from "./types.ts";

/** TEMP: remove before deploy — forces rain alerts for today and tomorrow. */
const TEMP_FORCE_RAIN_FORECAST = false;

export interface RainForecast {
  isRainForcastedForToday: boolean;
  isRainForcastedForTomorrow: boolean;
}

/** Open-Meteo WMO WW subset: drizzle/rain 51–67, rain showers 80–82, thunderstorms 95/96/99. */
function isRainWeatherCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67)
    || (code >= 80 && code <= 82)
    || code === 95
    || code === 96
    || code === 99
  );
}

export async function fetchRainForecast(lat: number, lng: number): Promise<RainForecast> {
  if (TEMP_FORCE_RAIN_FORECAST) {
    return { isRainForcastedForToday: true, isRainForcastedForTomorrow: true };
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "weather_code");
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Open-Meteo forecast error:", res.status, await res.text());
    return { isRainForcastedForToday: false, isRainForcastedForTomorrow: false };
  }

  const json = await res.json() as { daily?: { weather_code?: number[] } };
  const codes = json.daily?.weather_code ?? [];
  return {
    isRainForcastedForToday: codes[0] != null ? isRainWeatherCode(codes[0]) : false,
    isRainForcastedForTomorrow: codes[1] != null ? isRainWeatherCode(codes[1]) : false,
  };
}

export function rainNoteText(forecast: RainForecast): string {
  if (forecast.isRainForcastedForToday && forecast.isRainForcastedForTomorrow) {
    return "Rain is expected today and tomorrow — watering may not be needed.";
  }
  if (forecast.isRainForcastedForToday) {
    return "Rain is expected today — watering may not be needed.";
  }
  return "Rain is expected tomorrow — watering may not be needed.";
}

/**
 * Fetches rain forecasts for all distinct outdoor coordinates in the provided rows,
 * deduplicating concurrent requests for the same location.
 */
export async function loadRainForecastsByCoords(
  rows: WateringRow[],
): Promise<Map<string, RainForecast>> {
  const cache = new Map<string, RainForecast>();
  const pending = new Map<string, Promise<RainForecast>>();

  for (const row of rows) {
    if (!row.isOutdoor || row.weatherLat == null || row.weatherLng == null) continue;
    const key = `${Number(row.weatherLat)},${Number(row.weatherLng)}`;
    if (cache.has(key) || pending.has(key)) continue;
    pending.set(
      key,
      fetchRainForecast(Number(row.weatherLat), Number(row.weatherLng)).then((forecast) => {
        cache.set(key, forecast);
        return forecast;
      }),
    );
  }

  await Promise.allSettled(pending.values());
  return cache;
}
