import { Box, Group, Slider, Stack, Text, Title } from "@mantine/core";
import type { DeviceFormValidationErrors } from "@/components/DeviceFormModal/types";

interface Props {
  threshold: number;
  validation: DeviceFormValidationErrors;
  onThresholdChange: (value: number) => void;
}

export default function WateringAlertsSection({ threshold, validation, onThresholdChange }: Props) {
  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Title order={6}>Watering alerts</Title>
        <Text size="sm" fw={600}>
          {threshold}%
        </Text>
      </Group>
      <Text size="sm" c="dimmed">
        Alert when humidity drops below this value
      </Text>
      <Box pb="lg">
        <Slider
          min={0}
          max={100}
          step={1}
          value={threshold}
          onChange={onThresholdChange}
          marks={[
            { value: 0, label: "0%" },
            { value: 50, label: "50%" },
            { value: 100, label: "100%" },
          ]}
        />
      </Box>
      {validation.threshold && (
        <Text size="xs" c="red">
          {validation.threshold}
        </Text>
      )}
    </Stack>
  );
}
