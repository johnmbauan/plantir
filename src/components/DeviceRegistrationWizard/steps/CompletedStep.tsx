import { Stack, Text, Code, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

interface Props {
  registeredSerial: string | null;
}

export default function CompletedStep({ registeredSerial }: Props) {
  return (
    <Stack gap="sm" mt="md" align="center">
      <ThemeIcon radius="xl" size="xl" color="green" variant="light">
        <IconCheck size={24} />
      </ThemeIcon>
      <Text fw={600}>Device registered successfully</Text>
      {registeredSerial && (
        <Text size="sm" c="dimmed">
          Serial number: <Code>{registeredSerial}</Code>
        </Text>
      )}
      <Text size="sm" c="dimmed" ta="center">
        Your device is registered and will start sending readings shortly.
      </Text>
    </Stack>
  );
}
