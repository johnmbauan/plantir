import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconAdjustments } from "@tabler/icons-react";
import type { Device } from "@/types";
import type { DeviceFormValues } from "@/services/deviceService";

interface Props {
  calibration: DeviceFormValues["humidityConfig"];
  editingDevice: Device;
  onRecalibrate?: (device: Device) => void;
}

export default function CalibrationSection({ calibration, editingDevice, onRecalibrate }: Props) {
  return (
    <Stack gap="xs">
      <Title order={6}>Calibration</Title>
      <Group gap="lg">
        <Text size="sm" c="dimmed">
          Air (dry):{" "}
          <Text span ff="monospace" c="var(--mantine-color-text)">
            {calibration.airValue}
          </Text>
        </Text>
        <Text size="sm" c="dimmed">
          Water (wet):{" "}
          <Text span ff="monospace" c="var(--mantine-color-text)">
            {calibration.waterValue}
          </Text>
        </Text>
      </Group>
      {onRecalibrate && (
        <Button
          variant="light"
          leftSection={<IconAdjustments size={16} />}
          onClick={() => onRecalibrate(editingDevice)}
        >
          Recalibrate sensor
        </Button>
      )}
    </Stack>
  );
}
