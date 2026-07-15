import { Stack, Text, Button } from "@mantine/core";

interface Props {
  onRetry: () => void;
}

export default function CalibrationExpiredPrompt({ onRetry }: Props) {
  return (
    <Stack gap="xs" mt="xs">
      <Text size="sm" c="orange" fw={500}>
        The device&apos;s calibration window has ended after 2 minutes. Restart calibration to try again.
      </Text>
      <Button variant="default" size="sm" onClick={onRetry}>
        Restart calibration
      </Button>
    </Stack>
  );
}
