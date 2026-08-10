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
import {
  PLANT_IMAGES_BUCKET,
  pairedThumbPath,
  prepareImageVariants,
  storageObjectPathFromPublicUrl,
} from "@/utils/imageVariants";
import { getSessionUser, requireUser } from "@/utils/requireUser";
import { findLastWateredAt } from "@/utils/watering";

// ---------------------------------------------------------------------------
// Raw DB shapes (reflect get_user_plants RPC + history table rows)
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

interface RawDevice {
  id: number;
  serialNumber: string;
  humidity_sensors_config: RawSensorConfig[];
  humidityPercentage?: number | null;
  humidity_created_at?: string | null;
  batteryPercent?: number | null;
  battery_created_at?: string | null;
}

interface RawPlant {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  is_outdoor?: boolean;
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
  "7d": 24 * 7,
  "14d": 24 * 14,
  "30d": 24 * 30,
  "90d": 24 * 90,
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

function deviceHumidity(device: RawDevice): RawMeasurement | null {
  if (device.humidityPercentage == null || !device.humidity_created_at) return null;
  return {
    humidityPercentage: device.humidityPercentage,
    createdAt: device.humidity_created_at,
  };
}

function deviceBattery(device: RawDevice): RawBatteryMeasurement | null {
  if (device.batteryPercent == null || !device.battery_created_at) return null;
  return {
    batteryPercent: device.batteryPercent,
    createdAt: device.battery_created_at,
  };
}

function enrichPlant(plant: RawPlant): EnrichedPlant {
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
      is_outdoor: plant.is_outdoor ?? false,
      speciesId: plant.species_id ?? null,
      species,
      statuses: ["OFFLINE"],
      humidityPercent: null,
      threshold: null,
      lastMeasuredAt: null,
      deviceId: null,
      serialNumber: null,
      sleepDurationSeconds: null,
      batteryPercent: null,
    };
  }

  const config = humidityDevice.humidity_sensors_config[0];
  const latest = deviceHumidity(humidityDevice);
  const latestBattery = deviceBattery(humidityDevice);

  const statuses = computeStatuses(latest, config.minHumidityThreshold, config.sleepDurationSeconds);
  if (latestBattery !== null && latestBattery.batteryPercent < BATTERY_WARNING_THRESHOLD) {
    statuses.push("RECHARGE_NEEDED");
  }

  return {
    id: plant.id,
    name: plant.name,
    image_url: plant.imageUrl,
    created_at: plant.createdAt,
    is_outdoor: plant.is_outdoor ?? false,
    speciesId: plant.species_id ?? null,
    species,
    statuses,
    humidityPercent: latest?.humidityPercentage ?? null,
    threshold: config.minHumidityThreshold,
    lastMeasuredAt: latest?.createdAt ?? null,
    deviceId: humidityDevice.id,
    serialNumber: humidityDevice.serialNumber,
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

async function fetchUserPlantsRaw(plantIds?: number[]): Promise<RawPlant[]> {
  await requireUser();

  const { data, error } = await supabase.rpc("get_user_plants", {
    p_plant_ids: plantIds ?? null,
  });

  if (error) throw error;
  return (data ?? []) as RawPlant[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchPlants(): Promise<EnrichedPlant[]> {
  const plants = await fetchUserPlantsRaw();
  return sortPlants(plants.map(enrichPlant));
}

export async function fetchPlantStatusesByIds(plantIds: number[]): Promise<Map<number, PlantStatus[]>> {
  if (plantIds.length === 0) return new Map();

  const uniqueIds = [...new Set(plantIds)];
  const plants = await fetchUserPlantsRaw(uniqueIds);

  return new Map(plants.map((plant) => [plant.id, enrichPlant(plant).statuses]));
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
  const user = await requireUser();

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

/** Detects the most recent watering from humidity history (90-day lookback). */
export async function fetchLastWateredAt(plantId: number): Promise<string | null> {
  const { humidity } = await fetchPlantHistory(plantId, "90d");
  return findLastWateredAt(humidity);
}

// ---------------------------------------------------------------------------
// CRUD Operations for Plants Center
// ---------------------------------------------------------------------------

export async function createPlant(
  name: string,
  imageUrl: string | null,
  speciesId?: number | null,
  isOutdoor = false,
) {
  const user = await requireUser();

  const { error } = await supabase
    .from("plants")
    .insert([{ name, imageUrl, species_id: speciesId ?? null, is_outdoor: isOutdoor, user_id: user.id }]);

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

export async function updatePlant(
  id: number,
  name: string,
  imageUrl: string | null,
  speciesId?: number | null,
  isOutdoor = false,
) {
  const user = await requireUser();

  const { error } = await supabase
    .from("plants")
    .update({ name, imageUrl, species_id: speciesId ?? null, is_outdoor: isOutdoor })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

export async function deletePlant(id: number) {
  const user = await requireUser();

  const { error } = await supabase.from("plants").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Plant Image Storage
// ---------------------------------------------------------------------------

/** Uploads full + thumbnail variants and returns the full-size public URL. */
export async function uploadPlantImage(file: File): Promise<string> {
  const user = await requireUser();
  const id = crypto.randomUUID();
  const fullPath = `${user.id}/${id}.jpg`;
  const thumbPath = `${user.id}/${id}_thumb.jpg`;
  const { full, thumb } = await prepareImageVariants(file, id);

  const bucket = supabase.storage.from(PLANT_IMAGES_BUCKET);
  const { error: fullError } = await bucket.upload(fullPath, full, {
    upsert: false,
    contentType: "image/jpeg",
  });
  if (fullError) throw fullError;

  const { error: thumbError } = await bucket.upload(thumbPath, thumb, {
    upsert: false,
    contentType: "image/jpeg",
  });
  if (thumbError) {
    await bucket.remove([fullPath]);
    throw thumbError;
  }

  const { data } = bucket.getPublicUrl(fullPath);
  return data.publicUrl;
}

/**
 * Deletes a previously uploaded plant image (full + thumb) from storage.
 * Extracts the storage path from the full public URL.
 * Safe to call with null/undefined (no-op).
 */
export async function deletePlantImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;

  const user = await getSessionUser();
  if (!user) return;

  const path = storageObjectPathFromPublicUrl(publicUrl, PLANT_IMAGES_BUCKET);
  if (!path) return;

  const paths = [path];
  const thumb = pairedThumbPath(path);
  if (thumb && thumb !== path) paths.push(thumb);

  await supabase.storage.from(PLANT_IMAGES_BUCKET).remove(paths);
}
