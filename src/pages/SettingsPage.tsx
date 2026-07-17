import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import TelegramSetupAccordion from "@/components/TelegramSetupAccordion";
import { fetchSettings, upsertSettings } from "@/services/notificationService";
import { getErrorMessage } from "@/utils/error";

const TIMEZONE_OPTIONS = (Intl as unknown as { supportedValuesOf: (key: string) => string[] })
  .supportedValuesOf("timeZone")
  .map((tz) => ({ value: tz, label: tz }));

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, "0")}:00`,
}));

const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const cardStyle = { border: "1px solid var(--terracotta-100)" };

const stickyFooterStyle = {
  position: "sticky" as const,
  bottom: 0,
  zIndex: 2,
  border: "1px solid var(--terracotta-100)",
  background: "var(--terracotta-50)",
  boxShadow: "0 -4px 16px rgba(74, 43, 28, 0.06)",
};

export default function SettingsPage() {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [chatId, setChatId] = useState("");
  const [notificationHour, setNotificationHour] = useState(8);
  const [notificationTimezone, setNotificationTimezone] = useState(DEFAULT_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem("settings_visited", "true");
  }, []);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s) {
          setInAppEnabled(s.browser_notifications_enabled);
          setChatId(s.telegram_chat_id);
          setNotificationHour(s.notification_hour);
          setNotificationTimezone(s.notification_timezone);
        }
      })
      .catch((err) => {
        notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertSettings(chatId.trim(), notificationHour, notificationTimezone, inAppEnabled);
      notifications.show({ color: "green", title: "Saved", message: "Notification settings updated." });
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box p="md" maw={720} mx="auto" w="100%">
      <Title order={2} c="var(--green-700)" mb="md">
        Settings
      </Title>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Paper shadow="xs" radius="md" p="lg" style={cardStyle}>
            <Stack gap="lg">
              <Stack gap="xs">
                <Text fw={600} c="var(--green-700)">
                  Notifications
                </Text>
                <Text size="sm" c="dimmed">
                  Get watering reminders, offline alerts, and garden unlocks in the app.
                </Text>
              </Stack>

              <Switch
                label="In-app notifications"
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e.currentTarget.checked)}
                disabled={loading}
                styles={{
                  track: { cursor: loading ? undefined : "pointer" },
                  label: { cursor: loading ? undefined : "pointer" },
                }}
              />

              <Stack gap="xs">
                <Text fw={500} size="sm" c="var(--green-700)">
                  Schedule
                </Text>
                <Text size="sm" c="dimmed">
                  Daily alerts are sent at the chosen hour in your local timezone.
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Select
                    label="Notification time"
                    data={HOUR_OPTIONS}
                    value={String(notificationHour)}
                    onChange={(v) => setNotificationHour(Number(v))}
                    disabled={loading}
                    allowDeselect={false}
                    required
                  />
                  <Select
                    label="Timezone"
                    data={TIMEZONE_OPTIONS}
                    value={notificationTimezone}
                    onChange={(v) => setNotificationTimezone(v ?? DEFAULT_TIMEZONE)}
                    disabled={loading}
                    searchable
                    allowDeselect={false}
                    required
                  />
                </SimpleGrid>
              </Stack>
            </Stack>
          </Paper>

          <Paper shadow="xs" radius="md" p="lg" style={cardStyle}>
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap="xs">
                  <Text fw={600} c="var(--green-700)">
                    Telegram
                  </Text>
                  <Text size="sm" c="dimmed">
                    Receive alerts on Telegram in addition to the app.
                  </Text>
                </Stack>
                <Badge variant="light" color="gray" style={{ flexShrink: 0 }}>
                  Optional
                </Badge>
              </Group>

              <TelegramSetupAccordion />

              <TextInput
                label="Telegram Chat ID"
                placeholder="e.g. 123456789"
                description="Leave blank to receive alerts in the app only."
                value={chatId}
                onChange={(e) => setChatId(e.currentTarget.value)}
                disabled={loading}
              />
            </Stack>
          </Paper>

          <Paper shadow="xs" radius="md" p="lg" style={stickyFooterStyle}>
            <Group justify="space-between" align="center" wrap="nowrap" gap="md">
              <Text size="sm" c="dimmed">
                Changes apply to all your devices.
              </Text>
              <Button type="submit" loading={saving} disabled={loading} style={{ flexShrink: 0 }}>
                Save
              </Button>
            </Group>
          </Paper>
        </Stack>
      </form>
    </Box>
  );
}
