import type { IconSun } from "@tabler/icons-react";

export interface StoredCity {
  name: string;
  lat: number;
  lng: number;
}

export type LocationSource = "none" | "stored" | "manual";

type TablerIcon = typeof IconSun;

export interface WeatherInfo {
  WeatherIcon: TablerIcon;
  color: string;
  label: string;
}
