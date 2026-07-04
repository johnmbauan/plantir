export type PlantStatus = "HEALTHY" | "WATERING_NEEDED" | "OFFLINE" | "RECHARGE_NEEDED";
export type HistoryRange = "24h" | "7d" | "30d";

export type DeviceType = "humidity";

export interface HumidityConfig {
  id: number;
  deviceId: number;
  minHumidityThreshold: number;
  airValue: number;
  waterValue: number;
  sleepDurationSeconds: number;
  calibrationModeStartedAt: string | null;
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
  statuses: PlantStatus[];
  threshold: number | null;
  lastMeasuredAt: string | null;
  deviceId: number | null;
  sleepDurationSeconds: number | null;
  humidityPercent: number | null;
  batteryPercent: number | null;
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
