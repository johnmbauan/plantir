import supabase from "@/supabase";
import { evaluateAndToastUnlocks } from "@/services/achievementService";

export interface UserProfile {
  nickname: string | null;
  avatar_url: string | null;
}

const AVATARS_BUCKET = "avatars";

export async function fetchProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

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
export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a previously uploaded avatar from storage.
 * Safe to call with null/undefined (no-op).
 */
export async function deleteAvatar(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const marker = `/object/public/${AVATARS_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return;

  const path = publicUrl.slice(markerIndex + marker.length);
  await supabase.storage.from(AVATARS_BUCKET).remove([path]);
}
