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

interface RawDevice {
  id: number;
  humidity_sensors_config: RawSensorConfig[];
  humidity_measurements: RawMeasurement[];
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

function computeStatus(
  latestMeasurement: RawMeasurement | null,
  minHumidityThreshold: number,
  sleepDurationSeconds: number,
): PlantStatus {
  if (!latestMeasurement) return "OFFLINE";

  const ageMs = Date.now() - new Date(latestMeasurement.createdAt).getTime();
  const stalenessMs = sleepDurationSeconds * 2 * 1000;
  if (ageMs > stalenessMs) return "OFFLINE";

  if (latestMeasurement.humidityPercentage < minHumidityThreshold) return "WATERING_NEEDED";

  return "HEALTHY";
}

function enrichPlant(plant: RawPlant): EnrichedPlant {
  const humidityDevice = plant.devices?.find((d) => d.humidity_sensors_config?.length > 0);

  if (!humidityDevice) {
    return {
      id: plant.id,
      name: plant.name,
      image_url: plant.imageUrl,
      created_at: plant.createdAt,
      status: "OFFLINE",
      humidityPercent: null,
      threshold: null,
      lastMeasuredAt: null,
    };
  }

  const config = humidityDevice.humidity_sensors_config[0];
  const measurements = humidityDevice.humidity_measurements ?? [];
  const latest = measurements.reduce<RawMeasurement | null>(
    (best, m) => (!best || new Date(m.createdAt) > new Date(best.createdAt) ? m : best),
    null,
  );

  const status = computeStatus(latest, config.minHumidityThreshold, config.sleepDurationSeconds);

  return {
    id: plant.id,
    name: plant.name,
    image_url: plant.imageUrl,
    created_at: plant.createdAt,
    status,
    humidityPercent: latest?.humidityPercentage ?? null,
    threshold: config.minHumidityThreshold,
    lastMeasuredAt: latest?.createdAt ?? null,
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
  const { data, error } = await supabase.from("plants").select(
    `id, name, imageUrl, createdAt,
     devices(
       id,
       humidity_sensors_config(minHumidityThreshold, sleepDurationSeconds),
       humidity_measurements(humidityPercentage, createdAt)
     )`,
  );

  if (error) throw error;

  return sortPlants((data as RawPlant[]).map(enrichPlant));
}
