import { useEffect, useState } from "react";
import { lookupTelegramChat, type TelegramChatInfo, type TelegramLookupErrorCode } from "@/services/notificationService";

const DEBOUNCE_MS = 600;

interface LookupState {
  status: "idle" | "loading" | "success" | "error";
  info?: TelegramChatInfo;
  errorCode?: TelegramLookupErrorCode;
}

interface LookupResult {
  chatId: string;
  info?: TelegramChatInfo;
  errorCode?: TelegramLookupErrorCode;
}

export function useTelegramChatLookup(chatId: string): LookupState {
  const trimmed = chatId.trim();
  const [result, setResult] = useState<LookupResult | null>(null);

  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      lookupTelegramChat(trimmed)
        .then((info) => {
          if (controller.signal.aborted) return;
          setResult({ chatId: trimmed, info });
        })
        .catch((err: Error & { code?: string }) => {
          if (controller.signal.aborted) return;
          const code = (err.code as TelegramLookupErrorCode) ?? "unknown";
          setResult({ chatId: trimmed, errorCode: code });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  if (!trimmed) return { status: "idle" };
  if (result?.chatId !== trimmed) return { status: "loading" };
  if (result.errorCode) return { status: "error", errorCode: result.errorCode };
  return { status: "success", info: result.info };
}
