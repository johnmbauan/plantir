import { Stack, Text, Code, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  registeredSerial: string | null;
}

export default function CompletedStep({ registeredSerial }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md" align="center">
      <ThemeIcon radius="xl" size="xl" color="green" variant="light">
        <IconCheck size={24} />
      </ThemeIcon>
      <Text fw={600}>{t("registrationWizard.completed.title")}</Text>
      {registeredSerial && (
        <Text size="sm" c="dimmed">
          {t("registrationWizard.completed.serialNumberLabel")} <Code>{registeredSerial}</Code>
        </Text>
      )}
      <Text size="sm" c="dimmed" ta="center">
        {t("registrationWizard.completed.body")}
      </Text>
    </Stack>
  );
}
