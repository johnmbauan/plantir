import supabase from "@/supabase";
import type { Device, DeviceType, HumidityConfig } from "@/types";

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
  humidityConfig: Omit<HumidityConfig, "id" | "deviceId">;
}

export async function createDevice(values: DeviceFormValues): Promise<void> {
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
