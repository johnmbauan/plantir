import { Stack, Text, Button, Loader, Group } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

interface Props {
  started: boolean;
  loading: boolean;
  onStart: () => void;
}

export default function StartCalibrationStep({ started, loading, onStart }: Props) {
  if (!started) {
    return (
      <Stack mt="md">
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={onStart}
          loading={loading}
          size="md"
          fullWidth
        >
          Start calibration
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" mt="md">
      <Text size="sm">
        Press the <strong>Reset</strong> button on your Plantir device to wake it up,
        then put the cap back on.
      </Text>
      <Group gap="xs" mt="xs">
        <Loader size="xs" color="green" />
        <Text size="sm" c="dimmed">Waiting for the device to connect…</Text>
      </Group>
    </Stack>
  );
}
