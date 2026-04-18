import supabase from "@/supabase";

export interface NotificationSettings {
  id: number;
  telegram_chat_id: string;
}

export async function fetchSettings(): Promise<NotificationSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notification_settings")
    .select("id, telegram_chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertSettings(telegram_chat_id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notification_settings")
    .upsert(
      { user_id: user.id, telegram_chat_id, updatedAt: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) throw error;
}
