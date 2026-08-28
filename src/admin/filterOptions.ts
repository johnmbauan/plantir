import type { AdminFilterOptions } from "@/admin/adminService";
import { UNASSIGNED_OWNER_FILTER, UNASSIGNED_PLANT_FILTER } from "@/admin/constants";

type Translate = (key: string) => string;

export function buildSerialOptions(options: AdminFilterOptions, t: Translate) {
  return [
    { value: "", label: t("admin.filters.allDevices") },
    ...options.serials.map((serial) => ({ value: serial, label: serial })),
  ];
}

export function buildOwnerOptions(options: AdminFilterOptions, t: Translate) {
  const selectOptions = [
    { value: "", label: t("admin.filters.allOwners") },
    ...options.owners.map((email) => ({ value: email, label: email })),
  ];

  if (options.hasUnassignedOwner) {
    selectOptions.push({ value: UNASSIGNED_OWNER_FILTER, label: t("admin.device.unassigned") });
  }

  return selectOptions;
}

export function buildPlantOptions(options: AdminFilterOptions, t: Translate) {
  const selectOptions = [
    { value: "", label: t("admin.filters.allPlants") },
    ...options.plants.map((name) => ({ value: name, label: name })),
  ];

  if (options.hasUnassignedPlant) {
    selectOptions.push({ value: UNASSIGNED_PLANT_FILTER, label: t("admin.device.unassigned") });
  }

  return selectOptions;
}
