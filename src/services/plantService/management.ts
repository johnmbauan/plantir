import supabase from "@/supabase";
import { evaluateAndToastUnlocks } from "@/services/achievementService";
import { getSessionUser, requireUser } from "@/utils/requireUser";

export async function createPlant(
  name: string,
  imageUrl: string | null,
  speciesId?: number | null,
  isOutdoor = false,
) {
  const user = await requireUser();

  const { error } = await supabase
    .from("plants")
    .insert([{ name, imageUrl, species_id: speciesId ?? null, is_outdoor: isOutdoor, user_id: user.id }]);

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

export async function updatePlant(
  id: number,
  name: string,
  imageUrl: string | null,
  speciesId?: number | null,
  isOutdoor = false,
) {
  const user = await requireUser();

  const { error } = await supabase
    .from("plants")
    .update({ name, imageUrl, species_id: speciesId ?? null, is_outdoor: isOutdoor })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

export async function deletePlant(id: number) {
  const user = await requireUser();

  const { error } = await supabase.from("plants").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

const PLANT_IMAGES_BUCKET = "plant-images";

/** Uploads a file and returns its public URL. */
export async function uploadPlantImage(file: File): Promise<string> {
  const user = await requireUser();

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(PLANT_IMAGES_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(PLANT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a previously uploaded plant image from storage.
 * Extracts the storage path from the full public URL.
 * Safe to call with null/undefined (no-op).
 */
export async function deletePlantImage(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;

  const user = await getSessionUser();
  if (!user) return;

  // Extract path after "/object/public/plant-images/"
  const marker = `/object/public/${PLANT_IMAGES_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return; // not a storage URL, skip

  const path = publicUrl.slice(markerIndex + marker.length);
  await supabase.storage.from(PLANT_IMAGES_BUCKET).remove([path]);
}
