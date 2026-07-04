import { Stack, Text, List, ThemeIcon } from "@mantine/core";
import { IconDroplet, IconDeviceFloppy } from "@tabler/icons-react";

export default function PrepareStep() {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Before you start</Text>
      <Text size="sm">
        Calibration teaches the sensor what "completely dry" and "completely wet" feel like,
        so it can give you accurate soil moisture readings.
      </Text>
      <Text size="sm" fw={500}>You'll need:</Text>
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconDeviceFloppy size={14} />
            </ThemeIcon>
          }
        >
          Your Plantir device
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconDroplet size={14} />
            </ThemeIcon>
          }
        >
          A small glass of water
        </List.Item>
      </List>
      <Text size="sm" c="dimmed">
        The process takes about 1 minute.
      </Text>
    </Stack>
  );
}
