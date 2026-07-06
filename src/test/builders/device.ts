import type { Device, HumidityConfig } from '@/types'
import { DEFAULT_HUMIDITY_CONFIG } from '@/constants/deviceDefaults'

export function buildHumidityConfig(overrides: Partial<HumidityConfig> = {}): HumidityConfig {
  return {
    id: 1,
    deviceId: 1,
    minHumidityThreshold: DEFAULT_HUMIDITY_CONFIG.minHumidityThreshold,
    airValue: DEFAULT_HUMIDITY_CONFIG.airValue,
    waterValue: DEFAULT_HUMIDITY_CONFIG.waterValue,
    sleepDurationSeconds: DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds,
    calibrationModeStartedAt: null,
    ...overrides,
  }
}

export function buildDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 1,
    serialNumber: 'SN-001',
    plantId: 10,
    plantName: 'Monstera',
    type: 'humidity',
    humidityConfig: buildHumidityConfig(),
    ...overrides,
  }
}
