import { Button, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAdjustments, IconCheck } from "@tabler/icons-react";

interface Props {
  showCalibrate: boolean;
  onCalibrate: () => void;
  onDone: () => void;
}

export default function CreatedDeviceSuccess({ showCalibrate, onCalibrate, onDone }: Props) {
  return (
    <Stack gap="md" align="center" py="sm">
      <ThemeIcon radius="xl" size="xl" color="green" variant="light">
        <IconCheck size={24} />
      </ThemeIcon>
      <Text size="sm" c="dimmed" ta="center">
        Calibrate the sensor for accurate readings.
      </Text>
      <Group gap="xs" justify="center">
        {showCalibrate && (
          <Button
            variant="light"
            leftSection={<IconAdjustments size={16} />}
            onClick={onCalibrate}
          >
            Calibrate now
          </Button>
        )}
        <Button variant="default" onClick={onDone}>
          Done
        </Button>
      </Group>
    </Stack>
  );
}
