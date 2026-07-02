import {
  IconSun,
  IconCloud,
  IconCloudRain,
  IconSnowflake,
  IconCloudStorm,
  IconCloudFog,
} from "@tabler/icons-react";
import type { WeatherInfo } from "./types";

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

export function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
