import { useEffect, useState } from "react";
import { Box, Title, Paper, Stack, TextInput, Button, Text, Anchor } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { fetchSettings, upsertSettings } from "@/services/notificationService";
import { getErrorMessage } from "@/utils/error";

export default function SettingsPage() {
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => { if (s) setChatId(s.telegram_chat_id); })
      .catch((err) => {
        notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertSettings(chatId.trim());
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
          <Text fw={600} c="var(--green-700)">Telegram Notifications</Text>
          <Text size="sm" c="dimmed">
            Enter your Telegram chat ID to receive watering and offline alerts.{" "}
            <Anchor
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              How to find your chat ID
            </Anchor>
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Telegram Chat ID"
              placeholder="e.g. 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.currentTarget.value)}
              disabled={loading}
              required
            />
            <Button type="submit" loading={saving} disabled={loading} w="fit-content">
              Save
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
