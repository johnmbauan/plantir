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
} from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import {
  getNotificationHref,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type WateringPayload,
} from "@/services/notificationService";
import { getErrorMessage } from "@/utils/error";
import { relativeTime } from "@/utils/time";

function isWateringPayload(payload: AppNotification["payload"]): payload is WateringPayload {
  return "plantId" in payload && !("plants" in payload);
}

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
}) {
  const imageUrl = isWateringPayload(notification.payload)
    ? notification.payload.imageUrl
    : null;

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
          <Avatar radius="sm" size={36} color={notification.type === "watering" ? "yellow" : "red"}>
            {notification.type === "watering" ? "💧" : "📡"}
          </Avatar>
        )}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} lineClamp={1}>
            {notification.title}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2}>
            {notification.body.split("\n")[0]}
          </Text>
          <Text size="xs" c="dimmed">
            {relativeTime(notification.created_at) ?? ""}
          </Text>
        </Stack>
      </Group>
    </Menu.Item>
  );
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, removeItem, clearAll, refresh } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  async function handleSelect(notification: AppNotification) {
    try {
      await markNotificationRead(notification.id);
      removeItem(notification.id);
      navigate(getNotificationHref(notification));
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      clearAll();
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <Menu
      position="bottom-end"
      width={360}
      shadow="md"
      onOpen={() => void refresh()}
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
            aria-label="Notifications"
            style={{ color: "var(--green-700)" }}
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Group justify="space-between" px="sm" py="xs">
          <Text fw={600} size="sm">
            Notifications
          </Text>
          {items.length > 0 && (
            <Button
              variant="subtle"
              size="compact-xs"
              loading={markingAll}
              onClick={() => void handleMarkAllRead()}
            >
              Mark all as read
            </Button>
          )}
        </Group>

        {items.length === 0 ? (
          <Box px="sm" py="md">
            <Text size="sm" c="dimmed" ta="center">
              No new notifications
            </Text>
          </Box>
        ) : (
          <ScrollArea.Autosize mah={360} type="auto">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onSelect={(item) => void handleSelect(item)}
              />
            ))}
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
