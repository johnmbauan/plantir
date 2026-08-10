import type { EnrichedPlant } from "@/types";
import { isStorageImageUrl, PLANT_IMAGES_BUCKET, toThumbnailUrl } from "@/utils/imageVariants";

export function speciesLabel(plant: EnrichedPlant): string | null {
  if (!plant.species) return null;
  return plant.species.displayName ?? plant.species.scientificName ?? plant.species.sourceSpeciesId;
}

/** Prefer a plant Storage thumbnail; species remote URLs are returned as-is. */
export function plantThumbnailUrl(plant: EnrichedPlant): string | null {
  if (plant.image_url) {
    if (isStorageImageUrl(plant.image_url, PLANT_IMAGES_BUCKET)) {
      return toThumbnailUrl(plant.image_url) ?? plant.image_url;
    }
    return plant.image_url;
  }
  return plant.species?.imageUrl ?? null;
}
