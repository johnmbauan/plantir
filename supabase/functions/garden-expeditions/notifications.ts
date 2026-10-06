import type { SupabaseClient } from "@supabase/supabase-js";

let broadcastAuth: { supabaseUrl: string; serviceRoleKey: string } | null = null;

export function configureExpeditionBroadcast(supabaseUrl: string, serviceRoleKey: string): void {
  broadcastAuth = { supabaseUrl, serviceRoleKey };
}

async function broadcastNotification(userId: string, notification: Record<string, unknown>): Promise<void> {
  if (!broadcastAuth) return;
  try {
    const res = await fetch(`${broadcastAuth.supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: broadcastAuth.serviceRoleKey,
        Authorization: `Bearer ${broadcastAuth.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          topic: `user:${userId}`,
          event: "notification_created",
          payload: notification,
          private: true,
        }],
      }),
    });
    if (!res.ok) console.error("Expedition notification broadcast error:", await res.text());
  } catch (err) {
    console.error("Expedition notification broadcast failed:", err);
  }
}

export async function persistReturnNotification(
  admin: SupabaseClient,
  userId: string,
  expeditionId: string,
  destinationId: string,
): Promise<void> {
  const row = {
    user_id: userId,
    type: "expedition_returned",
    title: "Explorers returned",
    body: "Your explorers returned with something unusual.",
    payload: { expeditionId, destinationId },
  };

  const { data, error } = await admin
    .from("notifications")
    .insert(row)
    .select("id, type, title, body, payload, created_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return;
    console.error("Failed to insert expedition return notification:", error.message);
    return;
  }
  if (data) await broadcastNotification(userId, data);
}

export async function persistBondLevelNotification(
  admin: SupabaseClient,
  userId: string,
  achievementKey: string,
  bondLevel: number,
): Promise<void> {
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: userId,
      type: "bond_level",
      title: "Bond grew",
      body: "A new memory is waiting in their profile.",
      payload: { achievementKey, bondLevel },
    })
    .select("id, type, title, body, payload, created_at")
    .maybeSingle();

  if (error) {
    console.error("Failed to insert bond notification:", error.message);
    return;
  }
  if (data) await broadcastNotification(userId, data);
}

async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) console.error("Telegram expedition message failed:", await res.text());
}

async function sendEmail(to: string, locale: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return;
  const italian = locale.startsWith("it");
  const subject = italian ? "Tornati dalla missione" : "Explorers returned";
  const body = italian
    ? "Sono tornati e hanno portato qualcosa di curioso."
    : "Your explorers returned with something unusual.";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
      html: `<p>${body}</p>`,
    }),
  });
  if (!res.ok) console.error("Resend expedition email failed:", await res.text());
}

export async function sendExternalReturnNotice(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: settings } = await admin
    .from("notification_settings")
    .select("expedition_notifications_enabled, telegram_chat_id, email_notifications_enabled, locale")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings?.expedition_notifications_enabled) return;

  const italian = String(settings.locale ?? "en").startsWith("it");
  const text = italian
    ? "Sono tornati e hanno portato qualcosa di curioso."
    : "Your explorers returned with something unusual.";

  if (settings.telegram_chat_id) {
    await sendTelegram(String(settings.telegram_chat_id), text);
  }

  const { data: user } = await admin.auth.admin.getUserById(userId);
  const email = user.user?.email;
  if (email && settings.email_notifications_enabled) {
    await sendEmail(email, String(settings.locale ?? "en"));
  }
}
