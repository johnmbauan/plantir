import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import TelegramSetupAccordion from "@/components/TelegramSetupAccordion";
import { TelegramChatIdField } from "@/components/TelegramChatIdField";
import { fetchSettings, upsertSettings } from "@/services/notificationService";
import { markOnboardingStepComplete } from "@/services/onboardingService";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
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

const footerStyle = {
  border: "1px solid var(--terracotta-100)",
  background: "var(--terracotta-50)",
};

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { locale, setLocale } = useLanguage();
  const { session } = useAuth();
  const accountEmail = session?.user.email ?? "";

  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [chatId, setChatId] = useState("");
  const [notificationHour, setNotificationHour] = useState(6);
  const [notificationTimezone, setNotificationTimezone] = useState(DEFAULT_TIMEZONE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s) {
          setInAppEnabled(s.browser_notifications_enabled);
          setEmailEnabled(s.email_notifications_enabled);
          setChatId(s.telegram_chat_id);
          setNotificationHour(s.notification_hour);
          setNotificationTimezone(s.notification_timezone);
        }
      })
      .catch((err) => {
        notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
      })
      .finally(() => setLoading(false));
  }, [locale, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertSettings(
        chatId.trim(),
        notificationHour,
        notificationTimezone,
        inAppEnabled,
        emailEnabled,
      );
      void markOnboardingStepComplete("notifications").catch((err) => {
        console.error("Failed to record onboarding notifications step:", err);
      });
      notifications.show({ color: "green", title: t("settings.saved.title"), message: t("settings.saved.message") });
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleLocaleChange(next: string) {
    try {
      await setLocale(next as "it" | "en");
      notifications.show({
        color: "green",
        title: i18n.t("settings.language.saved.title", { lng: next }),
        message: i18n.t("settings.language.saved.message", { lng: next }),
      });
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    }
  }

  return (
    <Box p="md" maw={720} mx="auto" w="100%">
      <Title order={2} c="var(--green-700)" mb="md">
        {t("settings.title")}
      </Title>

      <Stack gap="md">
        <Paper shadow="xs" radius="md" p="lg" style={cardStyle}>
          <Stack gap="xs">
            <Text fw={600} c="var(--green-700)">
              {t("settings.language.title")}
            </Text>
            <SegmentedControl
              value={locale}
              onChange={handleLocaleChange}
              data={[
                { label: t("settings.language.it"), value: "it" },
                { label: t("settings.language.en"), value: "en" },
              ]}
              w="fit-content"
            />
          </Stack>
        </Paper>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Paper shadow="xs" radius="md" p="lg" style={cardStyle}>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Text fw={600} c="var(--green-700)">
                    {t("settings.notifications.title")}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t("settings.notifications.description")}
                  </Text>
                </Stack>

                <Switch
                  label={t("settings.notifications.inApp")}
                  checked={inAppEnabled}
                  onChange={(e) => setInAppEnabled(e.currentTarget.checked)}
                  disabled={loading}
                  styles={{
                    track: { cursor: loading ? undefined : "pointer" },
                    label: { cursor: loading ? undefined : "pointer" },
                  }}
                />

                <Switch
                  label={t("settings.notifications.email")}
                  description={
                    accountEmail
                      ? t("settings.notifications.emailDescription", { email: accountEmail })
                      : t("settings.notifications.emailDescriptionMissing")
                  }
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.currentTarget.checked)}
                  disabled={loading}
                  styles={{
                    track: { cursor: loading ? undefined : "pointer" },
                    label: { cursor: loading ? undefined : "pointer" },
                  }}
                />

                <Stack gap="xs">
                  <Text fw={500} size="sm" c="var(--green-700)">
                    {t("settings.notifications.scheduleTitle")}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t("settings.notifications.scheduleDescription")}
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Select
                      label={t("settings.notifications.notificationTime")}
                      data={HOUR_OPTIONS}
                      value={String(notificationHour)}
                      onChange={(v) => setNotificationHour(Number(v))}
                      disabled={loading}
                      allowDeselect={false}
                      required
                    />
                    <Select
                      label={t("settings.notifications.timezone")}
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
                      {t("settings.telegram.title")}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t("settings.telegram.description")}
                    </Text>
                  </Stack>
                  <Badge variant="light" color="gray" style={{ flexShrink: 0 }}>
                    {t("settings.telegram.optionalBadge")}
                  </Badge>
                </Group>

                <TelegramSetupAccordion />

                <TelegramChatIdField
                  value={chatId}
                  onChange={setChatId}
                  disabled={loading}
                />
              </Stack>
            </Paper>

            <Paper shadow="xs" radius="md" p="lg" style={footerStyle}>
              <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                <Text size="sm" c="dimmed">
                  {t("settings.footerHint")}
                </Text>
                <Button type="submit" loading={saving} disabled={loading} style={{ flexShrink: 0 }}>
                  {t("settings.save")}
                </Button>
              </Group>
            </Paper>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
