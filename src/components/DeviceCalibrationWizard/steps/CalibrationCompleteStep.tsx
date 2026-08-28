import { Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export default function CalibrationCompleteStep() {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md" align="center">
      <ThemeIcon radius="xl" size="xl" color="green" variant="light">
        <IconCheck size={24} />
      </ThemeIcon>
      <Text fw={600}>{t("calibrationWizard.complete.title")}</Text>
      <Text size="sm" c="dimmed" ta="center">
        {t("calibrationWizard.complete.body")}
      </Text>
    </Stack>
  );
}
