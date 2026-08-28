const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
}

export type WeatherForecast = DayForecast[];

interface OpenMeteoGeoResponse {
  results?: GeocodingResult[];
}

interface OpenMeteoForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

interface NominatimReverseResponse {
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
  };
}

export async function searchCities(name: string, lang = "en"): Promise<GeocodingResult[]> {
  const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(name)}&count=5&language=${lang}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);
  const data = (await res.json()) as OpenMeteoGeoResponse;
  return data.results ?? [];
}

export async function getWeatherForecast(lat: number, lng: number): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    forecast_days: "3",
    timezone: "auto",
  });
  const url = `${OPEN_METEO_BASE}/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
  const data = (await res.json()) as OpenMeteoForecastResponse;
  const { daily } = data;
  return daily.time.map((date, i) => ({
    date,
    maxTemp: Math.round(daily.temperature_2m_max[i]),
    minTemp: Math.round(daily.temperature_2m_min[i]),
    weatherCode: daily.weather_code[i],
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "Plantir App (weather widget)",
    },
  });
  if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`);
  const data = (await res.json()) as NominatimReverseResponse;
  const { address } = data;
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    "My Location"
  );
}
