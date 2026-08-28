import {
  IconSun,
  IconCloud,
  IconCloudRain,
  IconSnowflake,
  IconCloudStorm,
  IconCloudFog,
} from "@tabler/icons-react";
import type { WeatherInfo } from "./types";

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

export function getWeatherInfo(code: number): WeatherInfo {
  if (code === 0) return { label: "Clear", WeatherIcon: IconSun, color: "var(--terracotta-500)" };
  if (code <= 2) return { label: "Partly cloudy", WeatherIcon: IconCloud, color: "var(--green-400)" };
  if (code === 3) return { label: "Overcast", WeatherIcon: IconCloud, color: "var(--green-400)" };
  if (code <= 49) return { label: "Foggy", WeatherIcon: IconCloudFog, color: "var(--green-400)" };
  if (code <= 57) return { label: "Drizzle", WeatherIcon: IconCloudRain, color: "var(--green-500)" };
  if (code <= 67) return { label: "Rain", WeatherIcon: IconCloudRain, color: "var(--green-500)" };
  if (code <= 77) return { label: "Snow", WeatherIcon: IconSnowflake, color: "var(--green-400)" };
  if (code <= 82) return { label: "Showers", WeatherIcon: IconCloudRain, color: "var(--green-500)" };
  if (code <= 99) return { label: "Storm", WeatherIcon: IconCloudStorm, color: "var(--green-700)" };
  return { label: "Unknown", WeatherIcon: IconCloud, color: "var(--green-400)" };
}

function toLocaleCode(lang: string): string {
  return lang === "it" ? "it-IT" : "en-US";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDayLabel(dateStr: string, index: number, t: TFunc, lang = "en"): string {
  if (index === 0) return t("weather.today");
  if (index === 1) return t("weather.tomorrow");
  const date = new Date(`${dateStr}T00:00:00`);
  return capitalize(date.toLocaleDateString(toLocaleCode(lang), { weekday: "short" }));
}

export function formatShortDate(dateStr: string, lang = "en"): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return capitalize(date.toLocaleDateString(toLocaleCode(lang), { month: "short", day: "numeric" }));
}
