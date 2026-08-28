import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Indicator,
  Menu,
  ScrollArea,
  Stack,
  Text,
  Anchor,
} from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@/hooks/useNotifications";
import {
  getNotificationHref,
  isWateringPayload,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification,
  type AppNotification,
} from "@/services/notificationService";
import { getErrorMessage } from "@/utils/error";
import { isStorageImageUrl, PLANT_IMAGES_BUCKET, toThumbnailUrl } from "@/utils/imageVariants";
import { relativeTime } from "@/utils/time";
import { formatNotificationCopy } from "@/utils/notificationDisplay";

function notificationAvatar(notification: AppNotification): { color: string; label: string } {
  if (notification.type === "watering") return { color: "yellow", label: "💧" };
  if (notification.type === "offline") return { color: "red", label: "📡" };
  return { color: "green", label: "🌿" };
}

function notificationImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (isStorageImageUrl(raw, PLANT_IMAGES_BUCKET)) return toThumbnailUrl(raw) ?? raw;
  return raw;
}

function NotificationItem({
  notification,
  onSelect,
  onSnooze,
  snoozing,
}: {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
  onSnooze: (notification: AppNotification, hours: 24 | 48) => void;
  snoozing: boolean;
}) {
  const { t } = useTranslation();
  const watering = isWateringPayload(notification.payload) ? notification.payload : null;
  const { title, body } = formatNotificationCopy(notification);
  const imageUrl = notificationImageUrl(watering?.imageUrl ?? null);
  const fallback = notificationAvatar(notification);

  return (
    <Menu.Item
      key={notification.id}
      onClick={() => onSelect(notification)}
      style={{ whiteSpace: "normal", height: "auto", paddingBlock: 10 }}
    >
      <Group align="flex-start" wrap="nowrap" gap="sm">
        {imageUrl ? (
          <Avatar src={imageUrl} radius="sm" size={36} alt="" />
        ) : (
          <Avatar radius="sm" size={36} color={fallback.color}>
            {fallback.label}
          </Avatar>
        )}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} lineClamp={1}>
            {title}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {body.split("\n")[0]}
          </Text>
          {watering?.rain_forecasted && (
            <Text size="xs" c="blue">
              {t("notifications.rainExpected")}
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {relativeTime(notification.created_at, t) ?? ""}
          </Text>
          {watering && (
            <Group gap="xs" mt={2} onClick={(e) => e.stopPropagation()}>
              <Anchor
                component="button"
                type="button"
                size="xs"
                c="dimmed"
                disabled={snoozing}
                onClick={() => onSnooze(notification, 24)}
              >
                {t("notifications.snooze24h")}
              </Anchor>
              <Text size="xs" c="dimmed">·</Text>
              <Anchor
                component="button"
                type="button"
                size="xs"
                c="dimmed"
                disabled={snoozing}
                onClick={() => onSnooze(notification, 48)}
              >
                {t("notifications.snooze48h")}
              </Anchor>
            </Group>
          )}
        </Stack>
      </Group>
    </Menu.Item>
  );
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, unreadCount, removeItem, clearAll, refresh, realtimeAvailable } =
    useNotifications();
  const [markingAll, setMarkingAll] = useState(false);
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  async function handleSelect(notification: AppNotification) {
    try {
      await markNotificationRead(notification.id);
      removeItem(notification.id);
      navigate(getNotificationHref(notification));
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    }
  }

  async function handleSnooze(notification: AppNotification, hours: 24 | 48) {
    if (!isWateringPayload(notification.payload)) return;
    setSnoozingId(notification.id);
    try {
      await snoozeNotification(notification.payload.plantId, hours);
      await markNotificationRead(notification.id);
      removeItem(notification.id);
      notifications.show({
        color: "green",
        title: t("notifications.snoozed.title"),
        message: t("notifications.snoozed.message", {
          plantName: notification.payload.plantName,
          hours,
        }),
      });
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setSnoozingId(null);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      clearAll();
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <Menu
      position="bottom-end"
      width={360}
      shadow="md"
      onOpen={() => {
        // Realtime keeps the inbox fresh; only re-fetch when that channel is down.
        if (!realtimeAvailable) void refresh();
      }}
    >
      <Menu.Target>
        <Indicator
          inline
          label={unreadCount > 9 ? "9+" : unreadCount}
          size={16}
          disabled={unreadCount === 0}
          color="red"
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={t("notifications.bellAria")}
            style={{ color: "var(--green-700)" }}
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Group justify="space-between" px="sm" py="xs">
          <Text fw={600} size="sm">
            {t("notifications.title")}
          </Text>
          {items.length > 0 && (
            <Button
              variant="subtle"
              size="compact-xs"
              loading={markingAll}
              onClick={() => void handleMarkAllRead()}
            >
              {t("notifications.markAllAsRead")}
            </Button>
          )}
        </Group>

        {items.length === 0 ? (
          <Box px="sm" py="md">
            <Text size="sm" c="dimmed" ta="center">
              {t("notifications.empty")}
            </Text>
          </Box>
        ) : (
          <ScrollArea.Autosize mah={360} type="auto">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onSelect={(item) => void handleSelect(item)}
                onSnooze={(item, hours) => void handleSnooze(item, hours)}
                snoozing={snoozingId === notification.id}
              />
            ))}
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
