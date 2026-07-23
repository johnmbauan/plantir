import supabase from "@/supabase";
import type {
  EnrichedPlant,
  HistoryRange,
  MeasurementPoint,
  PlantHistory,
  PlantSpeciesSummary,
  PlantStatus,
} from "@/types";
import { requireUser } from "@/utils/requireUser";
import {
  enrichPlant,
  mapSpeciesSummary,
  PLANT_LIST_SELECT,
  PLANT_LIST_SPECIES_SELECT,
  publishPlantStatuses,
  sortPlants,
  type RawBatteryMeasurement,
  type RawMeasurement,
  type RawPlant,
  type RawPlantDevice,
  type RawPlantSpeciesSummary,
} from "@/services/plantService/enrichment";

const HISTORY_RANGE_HOURS: Record<HistoryRange, number> = {
  "7d": 24 * 7,
  "14d": 24 * 14,
  "30d": 24 * 30,
  "90d": 24 * 90,
};

export async function fetchPlants(): Promise<EnrichedPlant[]> {
  const user = await requireUser();

  const { data: plantsData, error: plantsError } = await supabase
    .from("plants")
    .select(PLANT_LIST_SELECT)
    .eq("user_id", user.id)
    // Nested embeds need the full path (devices.*) — bare table names raise PGRST108.
    .order("createdAt", { referencedTable: "devices.humidity_measurements", ascending: false })
    .limit(1, { referencedTable: "devices.humidity_measurements" })
    .order("createdAt", { referencedTable: "devices.battery_measurements", ascending: false })
    .limit(1, { referencedTable: "devices.battery_measurements" });

  if (plantsError) throw plantsError;

  const plants = sortPlants((plantsData as unknown as RawPlant[]).map((plant) => enrichPlant(plant)));
  publishPlantStatuses(plants);
  return plants;
}

export async function fetchPlantStatusesByIds(plantIds: number[]): Promise<Map<number, PlantStatus[]>> {
  if (plantIds.length === 0) return new Map();

  const user = await requireUser();
  const uniqueIds = [...new Set(plantIds)];

  const { data: plantsData, error: plantsError } = await supabase
    .from("plants")
    .select(PLANT_LIST_SELECT)
    .in("id", uniqueIds)
    .eq("user_id", user.id)
    .order("createdAt", { referencedTable: "devices.humidity_measurements", ascending: false })
    .limit(1, { referencedTable: "devices.humidity_measurements" })
    .order("createdAt", { referencedTable: "devices.battery_measurements", ascending: false })
    .limit(1, { referencedTable: "devices.battery_measurements" });

  if (plantsError) throw plantsError;

  const plants = (plantsData as unknown as RawPlant[]).map((plant) => enrichPlant(plant));
  return new Map(plants.map((plant) => [plant.id, plant.statuses]));
}

/** Loads care-text fields for the plant detail modal (not included in list fetch). */
export async function fetchSpeciesCareById(speciesId: number): Promise<PlantSpeciesSummary | null> {
  const { data, error } = await supabase
    .from("plant_species")
    .select(
      `${PLANT_LIST_SPECIES_SELECT}, sunlight, soil, watering, fertilization, pruning`,
    )
    .eq("id", speciesId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapSpeciesSummary(data as unknown as RawPlantSpeciesSummary);
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
