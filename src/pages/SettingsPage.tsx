import { useEffect, useState } from "react";
import {
  Box,
  Title,
  Paper,
  Stack,
  TextInput,
  Button,
  Text,
  Select,
  Switch,
  Divider,
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

export default function SettingsPage() {
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [chatId, setChatId] = useState("");
  const [notificationHour, setNotificationHour] = useState(8);
  const [notificationTimezone, setNotificationTimezone] = useState(DEFAULT_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s) {
          setBrowserEnabled(s.browser_notifications_enabled);
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
      await upsertSettings(chatId.trim(), notificationHour, notificationTimezone, browserEnabled);
      notifications.show({ color: "green", title: "Saved", message: "Notification settings updated." });
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box p="md" maw={560}>
      <Title order={2} c="var(--green-700)" mb="md">
        Settings
      </Title>

      <Paper
        shadow="xs"
        radius="md"
        p="lg"
        style={{ border: "1px solid var(--terracotta-100)" }}
      >
        <Stack gap="xs" mb="lg">
          <Text fw={600} c="var(--green-700)">Notifications</Text>
          <Text size="sm" c="dimmed">
            Get watering reminders and offline alerts in the app and optionally via Telegram.
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Switch
              label="Browser notifications"
              description="Show alerts in the notification bell while you are signed in."
              checked={browserEnabled}
              onChange={(e) => setBrowserEnabled(e.currentTarget.checked)}
              disabled={loading}
            />

            <Divider label="Schedule" labelPosition="left" />

            <Select
              label="Notification Time"
              description="The hour at which you will receive daily alerts."
              data={HOUR_OPTIONS}
              value={String(notificationHour)}
              onChange={(v) => setNotificationHour(Number(v))}
              disabled={loading}
              allowDeselect={false}
              required
            />
            <Select
              label="Timezone"
              description="Your local timezone for the notification time above."
              data={TIMEZONE_OPTIONS}
              value={notificationTimezone}
              onChange={(v) => setNotificationTimezone(v ?? DEFAULT_TIMEZONE)}
              disabled={loading}
              searchable
              allowDeselect={false}
              required
            />

            <Divider label="Telegram (optional)" labelPosition="left" />

            <TelegramSetupAccordion />

            <TextInput
              label="Telegram Chat ID"
              placeholder="e.g. 123456789"
              description="Leave blank to receive alerts in the app only."
              value={chatId}
              onChange={(e) => setChatId(e.currentTarget.value)}
              disabled={loading}
            />

            <Button type="submit" loading={saving} disabled={loading} w={{ base: "100%", sm: "fit-content" }}>
              Save
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
