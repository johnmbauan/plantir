import { createClient } from "@supabase/supabase-js";
import { jsonResponse, optionsResponse } from "../_shared/http.ts";

const CORS_ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export interface TelegramChatResult {
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export type LookupErrorCode = "invalid_chat_id" | "chat_not_found" | "bot_not_in_chat" | "telegram_error";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse(req, CORS_ORIGIN_HEADERS);
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, CORS_ORIGIN_HEADERS, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, CORS_ORIGIN_HEADERS, 500);
  }
  if (!botToken) {
    return jsonResponse({ error: "Telegram bot not configured" }, CORS_ORIGIN_HEADERS, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, CORS_ORIGIN_HEADERS, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, CORS_ORIGIN_HEADERS, 401);
  }

  let body: { chatId?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, CORS_ORIGIN_HEADERS, 400);
  }

  const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";
  if (!chatId || !/^-?\d+$/.test(chatId)) {
    return jsonResponse({ error: "invalid_chat_id" }, CORS_ORIGIN_HEADERS, 400);
  }

  const telegramRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getChat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    },
  );

  const telegramJson = await telegramRes.json() as {
    ok: boolean;
    result?: {
      type: string;
      title?: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    error_code?: number;
    description?: string;
  };

  if (!telegramJson.ok) {
    const errorCode = telegramJson.error_code ?? 0;
    const description = (telegramJson.description ?? "").toLowerCase();
    const isGroupId = chatId.startsWith("-");

    // Return 200 so the browser client can read the error code. Non-OK statuses
    // make supabase.functions.invoke drop the body and the UI shows a generic error.
    if (errorCode === 400 && description.includes("chat not found")) {
      return jsonResponse(
        { error: isGroupId ? "bot_not_in_chat" : "chat_not_found" },
        CORS_ORIGIN_HEADERS,
      );
    }
    if (errorCode === 403 || description.includes("bot was kicked") || description.includes("forbidden")) {
      return jsonResponse({ error: "bot_not_in_chat" }, CORS_ORIGIN_HEADERS);
    }
    return jsonResponse({ error: "telegram_error" }, CORS_ORIGIN_HEADERS);
  }

  const chat = telegramJson.result!;
  const result: TelegramChatResult = {
    type: chat.type as TelegramChatResult["type"],
  };
  if (chat.title) result.title = chat.title;
  if (chat.first_name) result.firstName = chat.first_name;
  if (chat.last_name) result.lastName = chat.last_name;
  if (chat.username) result.username = chat.username;

  return jsonResponse(result, CORS_ORIGIN_HEADERS);
});
