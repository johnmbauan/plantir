import type { PlantOption } from "@/components/DeviceFormModal/types";
import type { EnrichedPlant } from "@/types";

export function buildPlantAssignmentOptions(
  plants: EnrichedPlant[],
  editingDeviceId: number | null = null,
): PlantOption[] {
  return plants.map((plant) => ({
    value: String(plant.id),
    label: plant.name,
    recommendedThreshold: plant.species?.minSoilMoisture ?? null,
    hasDevice: plant.deviceId != null && plant.deviceId !== editingDeviceId,
  }));
}

export function toPlantSelectData(options: PlantOption[]) {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
    disabled: option.hasDevice ?? false,
  }));
}

export function hasAssignedPlantOptions(options: PlantOption[]): boolean {
  return options.some((option) => option.hasDevice);
}
