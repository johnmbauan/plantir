import type { PotDepthClass } from "@/constants/potDepth";

export type PlantStatus = "HEALTHY" | "WATERING_NEEDED" | "OFFLINE" | "RECHARGE_NEEDED";
export type HistoryRange = "7d" | "14d" | "30d" | "90d";

export type DeviceType = "humidity";
export type { PotDepthClass };

export interface HumidityConfig {
  id: number;
  deviceId: number;
  minHumidityThreshold: number;
  airValue: number;
  waterValue: number;
  sleepDurationSeconds: number;
  calibrationModeStartedAt: string | null;
  calibrated_at?: string | null;
}

export interface CalibrationReading {
  id: number;
  deviceId: number;
  rawValue: number;
  createdAt: string;
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
  is_outdoor: boolean;
  potDepthClass: PotDepthClass | null;
  speciesId?: number | null;
  species?: PlantSpeciesSummary | null;
  statuses: PlantStatus[];
  threshold: number | null;
  lastMeasuredAt: string | null;
  deviceId: number | null;
  serialNumber: string | null;
  sleepDurationSeconds: number | null;
  /** Effective humidity used on the dashboard and for watering status. */
  humidityPercent: number | null;
  /** Raw probe reading; set when a pot depth class adjusts the displayed %. */
  rawHumidityPercent: number | null;
  batteryPercent: number | null;
}

export interface PlantSpeciesSummary {
  id: number;
  source: string;
  sourceSpeciesId: string;
  scientificName: string | null;
  displayName: string | null;
  imageUrl: string | null;
  minSoilMoisture: number | null;
  maxSoilMoisture: number | null;
  minTemperatureCelsius: number | null;
  maxTemperatureCelsius: number | null;
  sunlight?: string | null;
  soil?: string | null;
  watering?: string | null;
  fertilization?: string | null;
  pruning?: string | null;
}

export interface PlantSpecies extends PlantSpeciesSummary {
  commonNames: string[];
  minEnvHumidity: number | null;
  maxEnvHumidity: number | null;
  minTemperatureCelsius: number | null;
  maxTemperatureCelsius: number | null;
  sunlight: string | null;
  soil: string | null;
  watering: string | null;
  fertilization: string | null;
  pruning: string | null;
  sourceUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementPoint {
  value: number;
  createdAt: string;
}

export interface PlantHistory {
  humidity: MeasurementPoint[];
  battery: MeasurementPoint[];
}

export interface DevicePairingToken {
  id: string;
  expiresAt: string;
  usedAt: string | null;
  registeredSerialNumber: string | null;
  registeredDeviceId: number | null;
}

export interface PairingBundle {
  tokenId: string;
  bundle: string;
  expiresAt: string;
}

export interface PairingPollResult {
  used: boolean;
  failed: boolean;
  failureReason?: string;
  deviceId?: number;
  serialNumber?: string;
}
