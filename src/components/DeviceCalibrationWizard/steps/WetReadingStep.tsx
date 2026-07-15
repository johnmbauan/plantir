import { Stack, Text, Group, Button, Loader } from "@mantine/core";
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
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Wet reading</Text>
      <Text size="sm">
        Gently lower the sensor into the glass of water until the <strong>white horizontal line</strong> on
        the black tip is just submerged. Hold the sensor steady at this depth while we capture a stable reading.

      </Text>
      <img
        src={sensorSubmergeGuide}
        alt="Sensor submerged in water up to the white horizontal line"
        style={guideImageStyle}
      />

      {calibrationExpired ? (
        <CalibrationExpiredPrompt onRetry={onRetry} />
      ) : timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            No reading received. Make sure the sensor is submerged correctly and the device is still connected.
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            Restart calibration
          </Button>
        </Stack>
      ) : saving ? (
        <Group gap="xs" mt="xs">
          <Loader size="xs" color="green" />
          <Text size="sm" c="dimmed">Saving calibration…</Text>
        </Group>
      ) : (
        <Stack gap={0} mt="xs">
          {readingRejected ? (
            <Text size="sm" c="orange" fw={500} mb="xs">
              Make sure the sensor tip is submerged in water down to the white horizontal line, without
              submerging the rest of the device.
            </Text>
          ) : (
            <Group gap="xs">
              <Loader size="xs" color="green" />
              <Text size="sm" c="dimmed">Waiting for a reading…</Text>
            </Group>
          )}
          <ReadingCountdownBar resetKey={countdownKey} />
        </Stack>
      )}
    </Stack>
  );
}
