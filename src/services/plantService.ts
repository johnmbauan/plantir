import supabase from "@/supabase";
import type {
  EnrichedPlant,
  HistoryRange,
  MeasurementPoint,
  PlantHistory,
  PlantSpeciesSummary,
  PlantStatus,
} from "@/types";
import { evaluateAndToastUnlocks } from "@/services/achievementService";

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

interface RawPlantDevice {
  id: number;
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
  species_id?: number | null;
  plant_species?: RawPlantSpeciesSummary | null;
  devices: RawDevice[];
}

interface RawPlantSpeciesSummary {
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
  sunlight: string | null;
  soil: string | null;
  watering: string | null;
  fertilization: string | null;
  pruning: string | null;
}

const BATTERY_WARNING_THRESHOLD = 10; // Percent below which we consider the battery needs recharge
const OFFLINE_SLEEP_MULTIPLIER = 2; // How many sleep cycles without measurements before considering the plant offline
const HISTORY_RANGE_HOURS: Record<HistoryRange, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

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
  const isOffline = ageMs > sleepDurationSeconds * OFFLINE_SLEEP_MULTIPLIER * 1000;
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
  const species: PlantSpeciesSummary | null = plant.plant_species
    ? {
        id: plant.plant_species.id,
        source: plant.plant_species.source,
        sourceSpeciesId: plant.plant_species.sourceSpeciesId,
        scientificName: plant.plant_species.scientificName,
        displayName: plant.plant_species.displayName,
        imageUrl: plant.plant_species.imageUrl,
        minSoilMoisture: plant.plant_species.minSoilMoisture,
        maxSoilMoisture: plant.plant_species.maxSoilMoisture,
        minTemperatureCelsius: plant.plant_species.minTemperatureCelsius,
        maxTemperatureCelsius: plant.plant_species.maxTemperatureCelsius,
        sunlight: plant.plant_species.sunlight,
        soil: plant.plant_species.soil,
        watering: plant.plant_species.watering,
        fertilization: plant.plant_species.fertilization,
        pruning: plant.plant_species.pruning,
      }
    : null;

  const humidityDevice = plant.devices?.find((d) => d.humidity_sensors_config?.length > 0);

  if (!humidityDevice) {
    return {
      id: plant.id,
      name: plant.name,
      image_url: plant.imageUrl,
      created_at: plant.createdAt,
      speciesId: plant.species_id ?? null,
      species,
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
  if (latestBattery !== null && latestBattery.batteryPercent < BATTERY_WARNING_THRESHOLD) {
    statuses.push("RECHARGE_NEEDED");
  }

  return {
    id: plant.id,
    name: plant.name,
    image_url: plant.imageUrl,
    created_at: plant.createdAt,
    speciesId: plant.species_id ?? null,
    species,
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
      `id, name, imageUrl, createdAt, species_id,
       plant_species(id, source, sourceSpeciesId, scientificName, displayName, imageUrl, minSoilMoisture, maxSoilMoisture, minTemperatureCelsius, maxTemperatureCelsius, sunlight, soil, watering, fertilization, pruning),
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

export async function fetchPlantStatusesByIds(plantIds: number[]): Promise<Map<number, PlantStatus[]>> {
  if (plantIds.length === 0) return new Map();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const uniqueIds = [...new Set(plantIds)];

  const { data: plantsData, error: plantsError } = await supabase
    .from("plants")
    .select(
      `id, name, imageUrl, createdAt, species_id,
       plant_species(id, source, sourceSpeciesId, scientificName, displayName, imageUrl, minSoilMoisture, maxSoilMoisture, minTemperatureCelsius, maxTemperatureCelsius, sunlight, soil, watering, fertilization, pruning),
       devices(id, humidity_sensors_config(minHumidityThreshold, sleepDurationSeconds))`,
    )
    .in("id", uniqueIds)
    .eq("user_id", user.id);

  if (plantsError) throw plantsError;

  const plants = plantsData as unknown as RawPlant[];
  const deviceIds = plants.flatMap((p) => (p.devices ?? []).map((d) => d.id));

  const humidityByDevice: Record<number, RawMeasurement> = {};
  const batteryByDevice: Record<number, RawBatteryMeasurement> = {};

  if (deviceIds.length > 0) {
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

  return new Map(
    plants.map((plant) => [plant.id, enrichPlant(plant, humidityByDevice, batteryByDevice).statuses]),
  );
}

function rangeStartIso(range: HistoryRange): string {
  const nowMs = Date.now();
  const rangeMs = HISTORY_RANGE_HOURS[range] * 60 * 60 * 1000;
  return new Date(nowMs - rangeMs).toISOString();
}

function toHumidityPoints(rows: RawMeasurement[]): MeasurementPoint[] {
  return rows.map((row) => ({ value: row.humidityPercentage, createdAt: row.createdAt }));
}

function toBatteryPoints(rows: RawBatteryMeasurement[]): MeasurementPoint[] {
  return rows.map((row) => ({ value: row.batteryPercent, createdAt: row.createdAt }));
}

export async function fetchPlantHistory(plantId: number, range: HistoryRange): Promise<PlantHistory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: plantData, error: plantError } = await supabase
    .from("plants")
    .select("devices(id)")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();

  if (plantError) throw plantError;

  const devices = (plantData?.devices ?? []) as RawPlantDevice[];
  if (devices.length === 0) return { humidity: [], battery: [] };

  const since = rangeStartIso(range);
  const deviceIds = devices.map((d) => d.id);

  const [{ data: humidityRows, error: humidityError }, { data: batteryRows, error: batteryError }] =
    await Promise.all([
      supabase
        .from("humidity_measurements")
        .select("humidityPercentage, createdAt")
        .in("deviceId", deviceIds)
        .gte("createdAt", since)
        .order("createdAt", { ascending: true }),
      supabase
        .from("battery_measurements")
        .select("batteryPercent, createdAt")
        .in("deviceId", deviceIds)
        .gte("createdAt", since)
        .order("createdAt", { ascending: true }),
    ]);

  if (humidityError) throw humidityError;
  if (batteryError) throw batteryError;

  return {
    humidity: toHumidityPoints((humidityRows ?? []) as RawMeasurement[]),
    battery: toBatteryPoints((batteryRows ?? []) as RawBatteryMeasurement[]),
  };
}

// ---------------------------------------------------------------------------
// CRUD Operations for Plants Center
// ---------------------------------------------------------------------------

export async function createPlant(name: string, imageUrl: string | null, speciesId?: number | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("plants")
    .insert([{ name, imageUrl, species_id: speciesId ?? null, user_id: user.id }]);

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

export async function updatePlant(
  id: number,
  name: string,
  imageUrl: string | null,
  speciesId?: number | null,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("plants")
    .update({ name, imageUrl, species_id: speciesId ?? null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

export async function deletePlant(id: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("plants").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Plant Image Storage
// ---------------------------------------------------------------------------

const PLANT_IMAGES_BUCKET = "plant-images";

/** Uploads a file and returns its public URL. */
export async function uploadPlantImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(PLANT_IMAGES_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(PLANT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a previously uploaded plant image from storage.
 * Extracts the storage path from the full public URL.
 * Safe to call with null/undefined (no-op).
 */
export async function deletePlantImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Extract path after "/object/public/plant-images/"
  const marker = `/object/public/${PLANT_IMAGES_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return; // not a storage URL, skip

  const path = publicUrl.slice(markerIndex + marker.length);
  await supabase.storage.from(PLANT_IMAGES_BUCKET).remove([path]);
}
