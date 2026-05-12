import supabase from "@/supabase";
import type { EnrichedPlant, PlantStatus } from "@/types";

// ---------------------------------------------------------------------------
// Raw DB shapes (reflect actual Supabase column names after migrations)
// ---------------------------------------------------------------------------

interface RawMeasurement {
  humidityPercentage: number;
  createdAt: string;
}

interface RawSensorConfig {
  minHumidityThreshold: number;
  sleepDurationSeconds: number;
}

interface RawBatteryMeasurement {
  batteryPercent: number;
  createdAt: string;
}

interface RawDeviceMeasurements {
  id: number;
  humidity_measurements: RawMeasurement[];
  battery_measurements: RawBatteryMeasurement[];
}

interface RawDevice {
  id: number;
  humidity_sensors_config: RawSensorConfig[];
}

interface RawPlant {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  devices: RawDevice[];
}

// ---------------------------------------------------------------------------
// Enrichment helpers
// ---------------------------------------------------------------------------

function computeStatuses(
  latestMeasurement: RawMeasurement | null,
  minHumidityThreshold: number,
  sleepDurationSeconds: number,
): PlantStatus[] {
  if (!latestMeasurement) return ["OFFLINE"];

  const ageMs = Date.now() - new Date(latestMeasurement.createdAt).getTime();
  const isOffline = ageMs > sleepDurationSeconds * 2 * 1000;
  const needsWater = latestMeasurement.humidityPercentage < minHumidityThreshold;

  if (isOffline && needsWater) return ["OFFLINE", "WATERING_NEEDED"];
  if (isOffline) return ["OFFLINE"];
  if (needsWater) return ["WATERING_NEEDED"];
  return ["HEALTHY"];
}

function enrichPlant(
  plant: RawPlant,
  humidityByDevice: Record<number, RawMeasurement>,
  batteryByDevice: Record<number, RawBatteryMeasurement>,
): EnrichedPlant {
  const humidityDevice = plant.devices?.find((d) => d.humidity_sensors_config?.length > 0);

  if (!humidityDevice) {
    return {
      id: plant.id,
      name: plant.name,
      image_url: plant.imageUrl,
      created_at: plant.createdAt,
      statuses: ["OFFLINE"],
      humidityPercent: null,
      threshold: null,
      lastMeasuredAt: null,
      deviceId: null,
      sleepDurationSeconds: null,
      batteryPercent: null,
    };
  }

  const config = humidityDevice.humidity_sensors_config[0];
  const latest = humidityByDevice[humidityDevice.id] ?? null;
  const latestBattery = batteryByDevice[humidityDevice.id] ?? null;

  const statuses = computeStatuses(latest, config.minHumidityThreshold, config.sleepDurationSeconds);

  return {
    id: plant.id,
    name: plant.name,
    image_url: plant.imageUrl,
    created_at: plant.createdAt,
    statuses,
    humidityPercent: latest?.humidityPercentage ?? null,
    threshold: config.minHumidityThreshold,
    lastMeasuredAt: latest?.createdAt ?? null,
    deviceId: humidityDevice.id,
    sleepDurationSeconds: config.sleepDurationSeconds,
    batteryPercent: latestBattery?.batteryPercent ?? null,
  };
}

function sortPlants(plants: EnrichedPlant[]): EnrichedPlant[] {
  return [...plants].sort((a, b) => {
    if (a.humidityPercent === null && b.humidityPercent === null)
      return a.name.localeCompare(b.name);
    if (a.humidityPercent === null) return 1;
    if (b.humidityPercent === null) return -1;
    if (b.humidityPercent !== a.humidityPercent) return b.humidityPercent - a.humidityPercent;
    return a.name.localeCompare(b.name);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchPlants(): Promise<EnrichedPlant[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Query 1: plant structure and device config — no measurements
  const { data: plantsData, error: plantsError } = await supabase
    .from("plants")
    .select(
      `id, name, imageUrl, createdAt,
       devices(id, humidity_sensors_config(minHumidityThreshold, sleepDurationSeconds))`,
    )
    .eq("user_id", user.id);

  if (plantsError) throw plantsError;

  const plants = plantsData as unknown as RawPlant[];
  const deviceIds = plants.flatMap((p) => (p.devices ?? []).map((d) => d.id));

  const humidityByDevice: Record<number, RawMeasurement> = {};
  const batteryByDevice: Record<number, RawBatteryMeasurement> = {};

  if (deviceIds.length > 0) {
    // Query 2: only the single latest measurement per device for each type
    const { data: devicesData, error: devicesError } = await supabase
      .from("devices")
      .select(`id, humidity_measurements(humidityPercentage, createdAt), battery_measurements(batteryPercent, createdAt)`)
      .in("id", deviceIds)
      .order("createdAt", { referencedTable: "humidity_measurements", ascending: false })
      .limit(1, { referencedTable: "humidity_measurements" })
      .order("createdAt", { referencedTable: "battery_measurements", ascending: false })
      .limit(1, { referencedTable: "battery_measurements" });

    if (devicesError) throw devicesError;

    for (const device of devicesData as unknown as RawDeviceMeasurements[]) {
      if (device.humidity_measurements?.[0]) humidityByDevice[device.id] = device.humidity_measurements[0];
      if (device.battery_measurements?.[0]) batteryByDevice[device.id] = device.battery_measurements[0];
    }
  }

  return sortPlants(plants.map((p) => enrichPlant(p, humidityByDevice, batteryByDevice)));
}

// ---------------------------------------------------------------------------
// CRUD Operations for Plants Center
// ---------------------------------------------------------------------------

export async function createPlant(name: string, imageUrl: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("plants")
    .insert([{ name, imageUrl, user_id: user.id }]);

  if (error) throw error;
}

export async function updatePlant(id: number, name: string, imageUrl: string | null) {
  const { error } = await supabase
    .from("plants")
    .update({ name, imageUrl })
    .eq("id", id);

  if (error) throw error;
}

export async function deletePlant(id: number) {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
}
