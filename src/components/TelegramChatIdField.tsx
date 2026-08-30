import { Loader, Text, TextInput } from "@mantine/core";
import { IconCheck, IconUser, IconUsersGroup, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTelegramChatLookup } from "@/hooks/useTelegramChatLookup";
import type { TelegramChatInfo, TelegramLookupErrorCode } from "@/services/notificationService";

interface TelegramChatPreviewProps {
  info: TelegramChatInfo;
}

function chatDisplayName(info: TelegramChatInfo): string {
  if (info.title) return info.title;
  return [info.firstName, info.lastName].filter(Boolean).join(" ");
}

function TelegramChatPreview({ info }: TelegramChatPreviewProps) {
  const { t } = useTranslation();
  const isGroup = info.type === "group" || info.type === "supergroup" || info.type === "channel";
  const displayName = chatDisplayName(info);
  const typeLabel = isGroup ? t("telegramChatId.typeGroup") : t("telegramChatId.typePersonal");

  return (
    <Text
      size="xs"
      c="green"
      style={{ display: "flex", alignItems: "center", gap: 4 }}
    >
      <IconCheck size={13} />
      {isGroup ? <IconUsersGroup size={13} /> : <IconUser size={13} />}
      <span>{typeLabel}</span>
      {displayName && <span style={{ fontWeight: 600 }}>{displayName}</span>}
      {info.username && <span style={{ color: "var(--mantine-color-dimmed)" }}>@{info.username}</span>}
    </Text>
  );
}

function lookupErrorKey(code: TelegramLookupErrorCode | undefined): string {
  switch (code) {
    case "chat_not_found":
      return "telegramChatId.errorNotFound";
    case "bot_not_in_chat":
      return "telegramChatId.errorBotNotInChat";
    default:
      return "telegramChatId.errorGeneric";
  }
}

interface TelegramChatIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TelegramChatIdField({ value, onChange, disabled }: TelegramChatIdFieldProps) {
  const { t } = useTranslation();
  const lookup = useTelegramChatLookup(value);

  return (
    <div>
      <TextInput
        label={t("settings.telegram.chatIdLabel")}
        placeholder={t("settings.telegram.chatIdPlaceholder")}
        description={t("settings.telegram.chatIdDescription")}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
      />
      <div style={{ minHeight: 20, marginTop: 4 }}>
        {lookup.status === "loading" && (
          <Text size="xs" c="dimmed" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Loader size={11} />
            {t("telegramChatId.verifying")}
          </Text>
        )}
        {lookup.status === "success" && lookup.info && (
          <TelegramChatPreview info={lookup.info} />
        )}
        {lookup.status === "error" && (
          <Text size="xs" c="red" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconX size={13} />
            {t(lookupErrorKey(lookup.errorCode))}
          </Text>
        )}
      </div>
    </div>
  );
}
