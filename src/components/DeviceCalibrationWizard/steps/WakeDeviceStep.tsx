import { Stack, Text, Group, Button, Loader } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";
import CalibrationExpiredPrompt from "./CalibrationExpiredPrompt";

interface Props {
  calibrationExpired: boolean;
  timedOut: boolean;
  onRetry: () => void;
}

export default function WakeDeviceStep({ calibrationExpired, timedOut, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("calibrationWizard.wake.title")}</Text>
      <Text size="sm">
        <Trans i18nKey="calibrationWizard.wake.instructions" components={{ bold: <strong /> }} />
      </Text>

      {calibrationExpired ? (
        <CalibrationExpiredPrompt onRetry={onRetry} />
      ) : timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            {t("calibrationWizard.wake.timeout")}
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            {t("calibrationWizard.wake.tryAgain")}
          </Button>
        </Stack>
      ) : (
        <Group gap="xs" mt="xs">
          <Loader size="xs" color="green" />
          <Text size="sm" c="dimmed">{t("calibrationWizard.wake.waiting")}</Text>
        </Group>
      )}
    </Stack>
  );
}
