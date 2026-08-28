import { Stack, Text, List, ThemeIcon } from "@mantine/core";
import { IconDroplet, IconDeviceFloppy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export default function PrepareStep() {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("calibrationWizard.prepare.title")}</Text>
      <Text size="sm">
        {t("calibrationWizard.prepare.intro")}
      </Text>
      <Text size="sm" fw={500}>{t("calibrationWizard.prepare.youllNeed")}</Text>
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconDeviceFloppy size={14} />
            </ThemeIcon>
          }
        >
          {t("calibrationWizard.prepare.needDevice")}
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconDroplet size={14} />
            </ThemeIcon>
          }
        >
          {t("calibrationWizard.prepare.needWater")}
        </List.Item>
      </List>
      <Text size="sm" c="dimmed">
        {t("calibrationWizard.prepare.duration")}
      </Text>
    </Stack>
  );
}
