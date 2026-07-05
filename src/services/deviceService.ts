import supabase from "@/supabase";
import type { CalibrationReading, Device, DeviceType, HumidityConfig, PairingBundle, PairingPollResult } from "@/types";

export { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";

interface RawDevice {
  id: number;
  serialNumber: string;
  plantId: number | null;
  type: DeviceType;
  plants: { name: string } | null;
  humidity_sensors_config: Omit<HumidityConfig, "deviceId">[];
}

function enrichDevice(raw: RawDevice): Device {
  const config = raw.humidity_sensors_config?.[0] ?? null;
  return {
    id: raw.id,
    serialNumber: raw.serialNumber,
    plantId: raw.plantId,
    plantName: raw.plants?.name ?? null,
    type: raw.type,
    humidityConfig: config ? { ...config, deviceId: raw.id } : null,
  };
}

export async function fetchDevices(): Promise<Device[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("devices")
    .select(
      `id, serialNumber, plantId, type,
       plants(name),
       humidity_sensors_config(id, minHumidityThreshold, airValue, waterValue, sleepDurationSeconds)`,
    )
    .eq("user_id", user.id);

  if (error) throw error;

  return (data as unknown as RawDevice[]).map(enrichDevice);
}

export interface DeviceFormValues {
  serialNumber: string;
  plantId: number | null;
  type: DeviceType;
  humidityConfig: Omit<HumidityConfig, "id" | "deviceId" | "calibrationModeStartedAt">;
}

export async function createDevice(values: DeviceFormValues): Promise<{ id: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .insert([{ serialNumber: values.serialNumber, plantId: values.plantId ?? null, type: values.type, user_id: user.id }])
    .select("id")
    .single();

  if (deviceError) throw deviceError;

  if (values.type === "humidity") {
    const { error: configError } = await supabase
      .from("humidity_sensors_config")
      .insert([{ ...values.humidityConfig, deviceId: device.id }]);

    if (configError) {
      // Compensate: remove the device so we don't leave an orphan row
      await supabase.from("devices").delete().eq("id", device.id);
      throw configError;
    }
  }

  return { id: device.id };
}

export async function updateDevice(id: number, values: DeviceFormValues): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: deviceError } = await supabase
    .from("devices")
    .update({ serialNumber: values.serialNumber, plantId: values.plantId ?? null, type: values.type })
    .eq("id", id)
    .eq("user_id", user.id);

  if (deviceError) throw deviceError;

  if (values.type === "humidity") {
    const { data: existing } = await supabase
      .from("humidity_sensors_config")
      .select("id")
      .eq("deviceId", id)
      .maybeSingle();

    if (existing) {
      const { error: configError } = await supabase
        .from("humidity_sensors_config")
        .update(values.humidityConfig)
        .eq("deviceId", id);

      if (configError) throw configError;
    } else {
      const { error: configError } = await supabase
        .from("humidity_sensors_config")
        .insert([{ ...values.humidityConfig, deviceId: id }]);

      if (configError) throw configError;
    }
  }
}

export async function deleteDevice(id: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("devices").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

export async function createPairingBundle(plantId?: number | null): Promise<PairingBundle> {
  const { data, error } = await supabase.functions.invoke("create-device-pairing", {
    body: { plantId: plantId ?? null },
  });

  if (error) throw error;
  if (!data || typeof data !== "object" || !("bundle" in data)) {
    throw new Error("Failed to create pairing bundle");
  }

  const result = data as PairingBundle;
  if (!result.tokenId || !result.bundle || !result.expiresAt) {
    throw new Error("Invalid pairing bundle response");
  }

  return result;
}

export async function startCalibrationMode(deviceId: number): Promise<void> {
  const { error } = await supabase
    .from("humidity_sensors_config")
    .update({ calibrationModeStartedAt: new Date().toISOString() })
    .eq("deviceId", deviceId);

  if (error) throw error;
}

export async function clearCalibrationMode(deviceId: number): Promise<void> {
  const { error } = await supabase
    .from("humidity_sensors_config")
    .update({ calibrationModeStartedAt: null })
    .eq("deviceId", deviceId);

  if (error) throw error;
}

export async function getLatestCalibrationReading(
  deviceId: number,
  since: string,
): Promise<CalibrationReading | null> {
  const { data, error } = await supabase
    .from("calibration_readings")
    .select("id, deviceId, rawValue, createdAt")
    .eq("deviceId", deviceId)
    .gt("createdAt", since)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as CalibrationReading | null;
}

export async function saveCalibrationValues(
  deviceId: number,
  airValue: number,
  waterValue: number,
): Promise<void> {
  const { error: configError } = await supabase
    .from("humidity_sensors_config")
    .update({ airValue, waterValue, calibrationModeStartedAt: null })
    .eq("deviceId", deviceId);

  if (configError) throw configError;

  const { error: deleteError } = await supabase
    .from("calibration_readings")
    .delete()
    .eq("deviceId", deviceId);

  if (deleteError) throw deleteError;
}

export async function pollPairingToken(tokenId: string): Promise<PairingPollResult> {
  const { data, error } = await supabase
    .from("device_pairing_tokens")
    .select("used_at, registered_device_id, registered_serial_number, failed_at, failure_reason")
    .eq("id", tokenId)
    .single();

  if (error) throw error;

  if (data.used_at) {
    return {
      used: true,
      failed: false,
      deviceId: data.registered_device_id ?? undefined,
      serialNumber: data.registered_serial_number ?? undefined,
    };
  }

  if (data.failed_at) {
    return {
      used: false,
      failed: true,
      failureReason: data.failure_reason ?? undefined,
    };
  }

  return { used: false, failed: false };
}
