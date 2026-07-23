import type { EnrichedPlant, PlantSpeciesSummary, PlantStatus } from "@/types";

// ---------------------------------------------------------------------------
// Raw DB shapes (reflect actual Supabase column names after migrations)
// ---------------------------------------------------------------------------

export interface RawMeasurement {
  humidityPercentage: number;
  createdAt: string;
}

export interface RawSensorConfig {
  minHumidityThreshold: number;
  sleepDurationSeconds: number;
}

export interface RawBatteryMeasurement {
  batteryPercent: number;
  createdAt: string;
}

export interface RawPlantDevice {
  id: number;
}

export interface RawDevice {
  id: number;
  serialNumber: string;
  humidity_sensors_config: RawSensorConfig[];
  humidity_measurements?: RawMeasurement[];
  battery_measurements?: RawBatteryMeasurement[];
}

export interface RawPlant {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  is_outdoor?: boolean;
  species_id?: number | null;
  plant_species?: RawPlantSpeciesSummary | null;
  devices: RawDevice[];
}

export interface RawPlantSpeciesSummary {
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

/** List query omits care-text fields; modal loads them on demand. */
export const PLANT_LIST_SPECIES_SELECT =
  "id, source, sourceSpeciesId, scientificName, displayName, imageUrl, minSoilMoisture, maxSoilMoisture, minTemperatureCelsius, maxTemperatureCelsius";

export const PLANT_LIST_SELECT = `id, name, imageUrl, createdAt, is_outdoor, species_id,
       plant_species(${PLANT_LIST_SPECIES_SELECT}),
       devices(
         id, serialNumber,
         humidity_sensors_config(minHumidityThreshold, sleepDurationSeconds),
         humidity_measurements(humidityPercentage, createdAt),
         battery_measurements(batteryPercent, createdAt)
       )`;

export const BATTERY_WARNING_THRESHOLD = 10;
const OFFLINE_SLEEP_MULTIPLIER = 2;

// ---------------------------------------------------------------------------
// Status cache (shared between dashboard fetch and notification auto-resolve)
// ---------------------------------------------------------------------------

let cachedStatusesByPlantId: Map<number, PlantStatus[]> | null = null;
const statusCacheWaiters: Array<(statuses: Map<number, PlantStatus[]>) => void> = [];

export function publishPlantStatuses(plants: EnrichedPlant[]): void {
  cachedStatusesByPlantId = new Map(plants.map((plant) => [plant.id, plant.statuses]));
  const snapshot = cachedStatusesByPlantId;
  while (statusCacheWaiters.length > 0) {
    statusCacheWaiters.shift()?.(snapshot);
  }
}

/** Returns cached statuses when every requested id is present; otherwise null. */
export function getCachedPlantStatuses(plantIds: number[]): Map<number, PlantStatus[]> | null {
  if (!cachedStatusesByPlantId || plantIds.length === 0) return null;
  const result = new Map<number, PlantStatus[]>();
  for (const id of plantIds) {
    const statuses = cachedStatusesByPlantId.get(id);
    if (!statuses) return null;
    result.set(id, statuses);
  }
  return result;
}

/** Waits briefly for Dashboard `fetchPlants` to populate the status cache. */
export function waitForCachedPlantStatuses(
  plantIds: number[],
  timeoutMs = 2500,
): Promise<Map<number, PlantStatus[]> | null> {
  const immediate = getCachedPlantStatuses(plantIds);
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const index = statusCacheWaiters.indexOf(onPublish);
      if (index >= 0) statusCacheWaiters.splice(index, 1);
      resolve(getCachedPlantStatuses(plantIds));
    }, timeoutMs);

    const onPublish = (statuses: Map<number, PlantStatus[]>) => {
      clearTimeout(timer);
      const result = new Map<number, PlantStatus[]>();
      for (const id of plantIds) {
        const value = statuses.get(id);
        if (!value) {
          resolve(null);
          return;
        }
        result.set(id, value);
      }
      resolve(result);
    };

    statusCacheWaiters.push(onPublish);
  });
}

// ---------------------------------------------------------------------------
// Enrichment helpers
// ---------------------------------------------------------------------------

export function computeStatuses(
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

export function mapSpeciesSummary(raw: RawPlantSpeciesSummary): PlantSpeciesSummary {
  return {
    id: raw.id,
    source: raw.source,
    sourceSpeciesId: raw.sourceSpeciesId,
    scientificName: raw.scientificName,
    displayName: raw.displayName,
    imageUrl: raw.imageUrl,
    minSoilMoisture: raw.minSoilMoisture,
    maxSoilMoisture: raw.maxSoilMoisture,
    minTemperatureCelsius: raw.minTemperatureCelsius,
    maxTemperatureCelsius: raw.maxTemperatureCelsius,
    sunlight: raw.sunlight ?? null,
    soil: raw.soil ?? null,
    watering: raw.watering ?? null,
    fertilization: raw.fertilization ?? null,
    pruning: raw.pruning ?? null,
  };
}

export function enrichPlant(plant: RawPlant): EnrichedPlant {
  const species: PlantSpeciesSummary | null = plant.plant_species
    ? mapSpeciesSummary(plant.plant_species)
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
  const latest = humidityDevice.humidity_measurements?.[0] ?? null;
  const latestBattery = humidityDevice.battery_measurements?.[0] ?? null;

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

export function sortPlants(plants: EnrichedPlant[]): EnrichedPlant[] {
  return [...plants].sort((a, b) => {
    if (a.humidityPercent === null && b.humidityPercent === null)
      return a.name.localeCompare(b.name);
    if (a.humidityPercent === null) return 1;
    if (b.humidityPercent === null) return -1;
    if (b.humidityPercent !== a.humidityPercent) return b.humidityPercent - a.humidityPercent;
    return a.name.localeCompare(b.name);
  });
}

export function applyHumidityMeasurement(
  plants: EnrichedPlant[],
  measurement: { deviceId: number; humidityPercentage: number; createdAt: string },
): EnrichedPlant[] {
  let changed = false;
  const next = plants.map((plant) => {
    if (plant.deviceId !== measurement.deviceId || plant.threshold == null || plant.sleepDurationSeconds == null) {
      return plant;
    }

    changed = true;
    const latest: RawMeasurement = {
      humidityPercentage: measurement.humidityPercentage,
      createdAt: measurement.createdAt,
    };
    const statuses = computeStatuses(latest, plant.threshold, plant.sleepDurationSeconds);
    if (plant.batteryPercent !== null && plant.batteryPercent < BATTERY_WARNING_THRESHOLD) {
      statuses.push("RECHARGE_NEEDED");
    }

    return {
      ...plant,
      humidityPercent: measurement.humidityPercentage,
      lastMeasuredAt: measurement.createdAt,
      statuses,
    };
  });

  if (changed) publishPlantStatuses(next);
  return changed ? next : plants;
}

export function applyBatteryMeasurement(
  plants: EnrichedPlant[],
  measurement: { deviceId: number; batteryPercent: number; createdAt: string },
): EnrichedPlant[] {
  let changed = false;
  const next = plants.map((plant) => {
    if (plant.deviceId !== measurement.deviceId) return plant;

    changed = true;
    const statuses: PlantStatus[] = plant.statuses.filter((status) => status !== "RECHARGE_NEEDED");
    if (measurement.batteryPercent < BATTERY_WARNING_THRESHOLD) {
      statuses.push("RECHARGE_NEEDED");
    }

    return {
      ...plant,
      batteryPercent: measurement.batteryPercent,
      statuses,
    };
  });

  if (changed) publishPlantStatuses(next);
  return changed ? next : plants;
}
