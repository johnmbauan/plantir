import { Stack, Text, List, ThemeIcon } from "@mantine/core";
import { IconCpu } from "@tabler/icons-react";

export default function OpenDeviceStep() {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Open device</Text>
      <List spacing="sm" size="sm" center>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconCpu size={14} />
            </ThemeIcon>
          }
        >
          Open the cap of the device.
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconCpu size={14} />
            </ThemeIcon>
          }
        >
          Gently push the black sensor from the bottom until the board reset button is reachable.
        </List.Item>
        <List.Item
          icon={
            <ThemeIcon radius="xl" size="sm" color="var(--green-700)" variant="light">
              <IconCpu size={14} />
            </ThemeIcon>
          }
        >
          You will press the <strong>Reset</strong> button in a later step. Do <strong>not</strong> press the Boot button.
        </List.Item>
      </List>
    </Stack>
  );
}
