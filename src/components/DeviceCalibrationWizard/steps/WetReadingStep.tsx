import { Stack, Text, Group, Button, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import sensorSubmergeGuide from "@/assets/sensor-submerge-guide.png";
import ReadingCountdownBar from "./ReadingCountdownBar";
import CalibrationExpiredPrompt from "./CalibrationExpiredPrompt";

const guideImageStyle: React.CSSProperties = {
  maxWidth: 220,
  borderRadius: 8,
  border: "1px solid var(--mantine-color-gray-3)",
};

interface Props {
  calibrationExpired: boolean;
  timedOut: boolean;
  readingRejected: boolean;
  countdownKey: number;
  saving: boolean;
  onRetry: () => void;
}

export default function WetReadingStep({
  calibrationExpired,
  timedOut,
  readingRejected,
  countdownKey,
  saving,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("calibrationWizard.wet.title")}</Text>
      <Text size="sm">
        {t("calibrationWizard.wet.instructions")}
      </Text>
      <img
        src={sensorSubmergeGuide}
        alt={t("calibrationWizard.wet.guideAlt")}
        style={guideImageStyle}
      />

      {calibrationExpired ? (
        <CalibrationExpiredPrompt onRetry={onRetry} />
      ) : timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            {t("calibrationWizard.wet.timeout")}
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            {t("calibrationWizard.wet.restart")}
          </Button>
        </Stack>
      ) : saving ? (
        <Group gap="xs" mt="xs">
          <Loader size="xs" color="green" />
          <Text size="sm" c="dimmed">{t("calibrationWizard.wet.saving")}</Text>
        </Group>
      ) : (
        <Stack gap={0} mt="xs">
          {readingRejected ? (
            <Text size="sm" c="orange" fw={500} mb="xs">
              {t("calibrationWizard.wet.rejected")}
            </Text>
          ) : (
            <Group gap="xs">
              <Loader size="xs" color="green" />
              <Text size="sm" c="dimmed">{t("calibrationWizard.wet.waiting")}</Text>
            </Group>
          )}
          <ReadingCountdownBar resetKey={countdownKey} />
        </Stack>
      )}
    </Stack>
  );
}
