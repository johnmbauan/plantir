import { Stack, Text, Group, Button, Loader } from "@mantine/core";
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
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Dry reading</Text>
      <Text size="sm">
        Hold the <strong>black sensor tip</strong> in open air, away from any soil or water.
        Hold position while we capture a stable reading.
      </Text>

      {calibrationExpired ? (
        <CalibrationExpiredPrompt onRetry={onRetry} />
      ) : timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            No reading received. Make sure you pressed the restart button and the device connected to Wi-Fi.
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </Stack>
      ) : (
        <Stack gap={0} mt="xs">
          {readingRejected ? (
            <Text size="sm" c="orange" fw={500} mb="xs">
              Make sure the black sensor tip is in open air, away from any soil or water, then hold still.
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
