import type { EnrichedPlant, PlantStatus } from "@/types";
import type { SortDirection } from "@/utils/sort";

export type PlantsTabSortKey = "name" | "status" | "moisture" | "device";

/** Lower rank = more urgent / sorts first when ascending. */
const STATUS_RANK: Record<PlantStatus, number> = {
  OFFLINE: 0,
  RECHARGE_NEEDED: 1,
  WATERING_NEEDED: 2,
  HEALTHY: 3,
};

export function plantMatchesSearch(plant: EnrichedPlant, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;

  const speciesDisplay = (plant.species?.displayName ?? "").toLowerCase();
  const speciesScientific = (plant.species?.scientificName ?? "").toLowerCase();
  const serial = (plant.serialNumber ?? "").toLowerCase();

  return (
    plant.name.toLowerCase().includes(q) ||
    speciesDisplay.includes(q) ||
    speciesScientific.includes(q) ||
    serial.includes(q)
  );
}

function primaryStatusRank(plant: EnrichedPlant): number {
  if (plant.statuses.length === 0) return STATUS_RANK.HEALTHY;
  return Math.min(...plant.statuses.map((s) => STATUS_RANK[s]));
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
  direction: SortDirection,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function compareNullableString(
  a: string | null,
  b: string | null,
  direction: SortDirection,
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b);
  return direction === "asc" ? cmp : -cmp;
}

export function sortPlantsByColumn(
  plants: EnrichedPlant[],
  sortKey: PlantsTabSortKey,
  direction: SortDirection,
): EnrichedPlant[] {
  return [...plants].sort((a, b) => {
    let cmp = 0;

    if (sortKey === "name") {
      cmp = a.name.localeCompare(b.name);
      if (direction === "desc") cmp = -cmp;
    } else if (sortKey === "status") {
      cmp = primaryStatusRank(a) - primaryStatusRank(b);
      if (direction === "desc") cmp = -cmp;
    } else if (sortKey === "moisture") {
      cmp = compareNullableNumber(a.humidityPercent, b.humidityPercent, direction);
    } else {
      cmp = compareNullableString(a.serialNumber, b.serialNumber, direction);
    }

    if (cmp !== 0) return cmp;
    return a.name.localeCompare(b.name);
  });
}

export function speciesLabel(plant: EnrichedPlant): string | null {
  if (!plant.species) return null;
  return plant.species.displayName ?? plant.species.scientificName ?? plant.species.sourceSpeciesId;
}

export function plantThumbnailUrl(plant: EnrichedPlant): string | null {
  return plant.image_url ?? plant.species?.imageUrl ?? null;
}
