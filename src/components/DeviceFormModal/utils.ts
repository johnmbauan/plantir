import { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";
import type { DeviceFormValues } from "@/services/deviceService";
import type { Device } from "@/types";

export const DEFAULT_HUMIDITY: DeviceFormValues["humidityConfig"] = {
  ...DEFAULT_HUMIDITY_CONFIG,
};

export function defaultFormValues(): DeviceFormValues {
  return {
    serialNumber: "",
    plantId: null,
    type: "humidity",
    humidityConfig: { ...DEFAULT_HUMIDITY },
  };
}

export function formValuesFromDevice(device: Device): DeviceFormValues {
  const sleepDurationSeconds =
    device.humidityConfig?.sleepDurationSeconds ?? DEFAULT_HUMIDITY.sleepDurationSeconds;

  return {
    serialNumber: device.serialNumber,
    plantId: device.plantId,
    type: device.type,
    humidityConfig: device.humidityConfig
      ? {
          minHumidityThreshold: device.humidityConfig.minHumidityThreshold,
          airValue: device.humidityConfig.airValue,
          waterValue: device.humidityConfig.waterValue,
          sleepDurationSeconds,
        }
      : { ...DEFAULT_HUMIDITY },
  };
}
