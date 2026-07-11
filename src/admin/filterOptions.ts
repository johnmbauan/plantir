import type { AdminFilterOptions } from "@/admin/adminService";
import { UNASSIGNED_OWNER_FILTER, UNASSIGNED_PLANT_FILTER } from "@/admin/constants";

export function buildSerialOptions(options: AdminFilterOptions) {
  return [
    { value: "", label: "All devices" },
    ...options.serials.map((serial) => ({ value: serial, label: serial })),
  ];
}

export function buildOwnerOptions(options: AdminFilterOptions) {
  const selectOptions = [
    { value: "", label: "All owners" },
    ...options.owners.map((email) => ({ value: email, label: email })),
  ];

  if (options.hasUnassignedOwner) {
    selectOptions.push({ value: UNASSIGNED_OWNER_FILTER, label: "Unassigned" });
  }

  return selectOptions;
}

export function buildPlantOptions(options: AdminFilterOptions) {
  const selectOptions = [
    { value: "", label: "All plants" },
    ...options.plants.map((name) => ({ value: name, label: name })),
  ];

  if (options.hasUnassignedPlant) {
    selectOptions.push({ value: UNASSIGNED_PLANT_FILTER, label: "Unassigned" });
  }

  return selectOptions;
}
