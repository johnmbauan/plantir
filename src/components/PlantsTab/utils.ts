import type { EnrichedPlant, PlantStatus } from "@/types";
import {
  compareNullableNumber,
  compareNullableString,
  compareString,
  type SortDirection,
} from "@/utils/sort";
import { matchesAnySearchField } from "@/utils/search";

export type PlantsTabSortKey = "name" | "status" | "moisture" | "device";

/** Lower rank = more urgent / sorts first when ascending. */
const STATUS_RANK: Record<PlantStatus, number> = {
  OFFLINE: 0,
  RECHARGE_NEEDED: 1,
  WATERING_NEEDED: 2,
  HEALTHY: 3,
};

export function plantMatchesSearch(plant: EnrichedPlant, search: string): boolean {
  return matchesAnySearchField(search, [
    plant.name,
    plant.species?.displayName,
    plant.species?.scientificName,
    plant.serialNumber,
  ]);
}

function primaryStatusRank(plant: EnrichedPlant): number {
  if (plant.statuses.length === 0) return STATUS_RANK.HEALTHY;
  return Math.min(...plant.statuses.map((s) => STATUS_RANK[s]));
}

export function sortPlantsByColumn(
  plants: EnrichedPlant[],
  sortKey: PlantsTabSortKey,
  direction: SortDirection,
): EnrichedPlant[] {
  return [...plants].sort((a, b) => {
    let cmp = 0;

    if (sortKey === "name") {
      cmp = compareString(a.name, b.name, direction);
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
