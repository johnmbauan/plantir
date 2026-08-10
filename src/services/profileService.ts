import supabase from "@/supabase";
import { evaluateAndToastUnlocks } from "@/services/achievementService";
import {
  AVATARS_BUCKET,
  pairedThumbPath,
  prepareImageVariants,
  storageObjectPathFromPublicUrl,
} from "@/utils/imageVariants";
import { getSessionUser, requireUser } from "@/utils/requireUser";

export interface UserProfile {
  nickname: string | null;
  avatar_url: string | null;
}

export async function fetchProfile(): Promise<UserProfile | null> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(
  nickname: string | null,
  avatarUrl: string | null,
): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        nickname,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) throw error;
  void evaluateAndToastUnlocks();
}

/** Uploads full + thumbnail variants and returns the full-size public URL. */
export async function uploadAvatar(file: File): Promise<string> {
  const user = await requireUser();
  const id = crypto.randomUUID();
  const fullPath = `${user.id}/${id}.jpg`;
  const thumbPath = `${user.id}/${id}_thumb.jpg`;
  const { full, thumb } = await prepareImageVariants(file, id);

  const bucket = supabase.storage.from(AVATARS_BUCKET);
  const { error: fullError } = await bucket.upload(fullPath, full, {
    upsert: false,
    contentType: "image/jpeg",
  });
  if (fullError) throw fullError;

  const { error: thumbError } = await bucket.upload(thumbPath, thumb, {
    upsert: false,
    contentType: "image/jpeg",
  });
  if (thumbError) {
    await bucket.remove([fullPath]);
    throw thumbError;
  }

  const { data } = bucket.getPublicUrl(fullPath);
  return data.publicUrl;
}

/**
 * Deletes a previously uploaded avatar (full + thumb) from storage.
 * Safe to call with null/undefined (no-op).
 */
export async function deleteAvatar(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;

  const user = await getSessionUser();
  if (!user) return;

  const path = storageObjectPathFromPublicUrl(publicUrl, AVATARS_BUCKET);
  if (!path) return;

  const paths = [path];
  const thumb = pairedThumbPath(path);
  if (thumb && thumb !== path) paths.push(thumb);

  await supabase.storage.from(AVATARS_BUCKET).remove(paths);
}
