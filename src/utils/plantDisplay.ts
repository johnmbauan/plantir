import type { EnrichedPlant } from "@/types";

export function speciesLabel(plant: EnrichedPlant): string | null {
  if (!plant.species) return null;
  return plant.species.displayName ?? plant.species.scientificName ?? plant.species.sourceSpeciesId;
}

export function plantThumbnailUrl(plant: EnrichedPlant): string | null {
  return plant.image_url ?? plant.species?.imageUrl ?? null;
}
