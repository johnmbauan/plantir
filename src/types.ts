export type PlantStatus = "HEALTHY" | "WATERING_NEEDED" | "OFFLINE";

export type DeviceType = "humidity";

export interface HumidityConfig {
  id: number;
  deviceId: number;
  minHumidityThreshold: number;
  airValue: number;
  waterValue: number;
  sleepDurationSeconds: number;
}

export interface Device {
  id: number;
  serialNumber: string;
  plantId: number | null;
  plantName: string | null;
  type: DeviceType;
  humidityConfig: HumidityConfig | null;
}

export interface EnrichedPlant {
  id: number;
  name: string;
  image_url: string | null;
  created_at: string;
  statuses: PlantStatus[];
  humidityPercent: number | null;
  threshold: number | null;
  lastMeasuredAt: string | null;
}
