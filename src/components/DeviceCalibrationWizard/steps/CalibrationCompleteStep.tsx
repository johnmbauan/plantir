import { Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

export default function CalibrationCompleteStep() {
  return (
    <Stack gap="sm" mt="md" align="center">
      <ThemeIcon radius="xl" size="xl" color="green" variant="light">
        <IconCheck size={24} />
      </ThemeIcon>
      <Text fw={600}>Sensor calibrated!</Text>
      <Text size="sm" c="dimmed" ta="center">
        Place the device back in the soil. It will take a reading in about a minute.
      </Text>
    </Stack>
  );
}
