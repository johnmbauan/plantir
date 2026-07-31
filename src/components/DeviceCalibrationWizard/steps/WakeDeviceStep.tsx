import { Stack, Text, Group, Button, Loader } from "@mantine/core";
import CalibrationExpiredPrompt from "./CalibrationExpiredPrompt";

interface Props {
  calibrationExpired: boolean;
  timedOut: boolean;
  onRetry: () => void;
}

export default function WakeDeviceStep({ calibrationExpired, timedOut, onRetry }: Props) {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Wake the device</Text>
      <Text size="sm">
        Remove the cap. Press the <strong>Restart</strong> button on your Plantir device to wake it up,
        then put the cap back on.
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
        <Group gap="xs" mt="xs">
          <Loader size="xs" color="green" />
          <Text size="sm" c="dimmed">Waiting for the device to connect…</Text>
        </Group>
      )}
    </Stack>
  );
}
