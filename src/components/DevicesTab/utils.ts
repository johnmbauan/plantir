import type { Device } from "@/types";
import {
  compareNullableNumber,
  compareNullableString,
  compareString,
  type SortDirection,
} from "@/utils/sort";
import { matchesAnySearchField } from "@/utils/search";

export type DevicesTabSortKey = "serial" | "plant" | "interval";

export function isDeviceCalibrated(device: Device): boolean {
  return device.humidityConfig?.calibrated_at != null;
}

export function deviceMatchesSearch(device: Device, search: string): boolean {
  return matchesAnySearchField(search, [device.serialNumber, device.plantName]);
}

export function sortDevicesByColumn(
  devices: Device[],
  sortKey: DevicesTabSortKey,
  direction: SortDirection,
): Device[] {
  return [...devices].sort((a, b) => {
    let cmp = 0;

    if (sortKey === "serial") {
      cmp = compareString(a.serialNumber, b.serialNumber, direction);
    } else if (sortKey === "plant") {
      cmp = compareNullableString(a.plantName, b.plantName, direction);
    } else {
      cmp = compareNullableNumber(
        a.humidityConfig?.sleepDurationSeconds ?? null,
        b.humidityConfig?.sleepDurationSeconds ?? null,
        direction,
      );
    }

    if (cmp !== 0) return cmp;
    return a.serialNumber.localeCompare(b.serialNumber);
  });
}
