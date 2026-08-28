import { Stack, Text, Group, Button, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import ReadingCountdownBar from "./ReadingCountdownBar";
import CalibrationExpiredPrompt from "./CalibrationExpiredPrompt";

interface Props {
  calibrationExpired: boolean;
  timedOut: boolean;
  readingRejected: boolean;
  countdownKey: number;
  onRetry: () => void;
}

export default function DryReadingStep({
  calibrationExpired,
  timedOut,
  readingRejected,
  countdownKey,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("calibrationWizard.dry.title")}</Text>
      <Text size="sm">
        {t("calibrationWizard.dry.instructions")}
      </Text>

      {calibrationExpired ? (
        <CalibrationExpiredPrompt onRetry={onRetry} />
      ) : timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            {t("calibrationWizard.dry.timeout")}
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            {t("calibrationWizard.wake.tryAgain")}
          </Button>
        </Stack>
      ) : (
        <Stack gap={0} mt="xs">
          {readingRejected ? (
            <Text size="sm" c="orange" fw={500} mb="xs">
              {t("calibrationWizard.dry.rejected")}
            </Text>
          ) : (
            <Group gap="xs">
              <Loader size="xs" color="green" />
              <Text size="sm" c="dimmed">{t("calibrationWizard.dry.waiting")}</Text>
            </Group>
          )}
          <ReadingCountdownBar resetKey={countdownKey} />
        </Stack>
      )}
    </Stack>
  );
}
