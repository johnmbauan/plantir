export const DEFAULT_HUMIDITY_CONFIG = {
  minHumidityThreshold: 15,
  airValue: 2400,
  waterValue: 850,
  sleepDurationSeconds: 8 * 60 * 60, // 8h
} as const;
