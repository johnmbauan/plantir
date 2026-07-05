import { NumberInput, Select, Stack, Text, Title } from "@mantine/core";
import type { DeviceFormValidationErrors } from "@/components/DeviceFormModal/types";
import { formatInterval, INTERVAL_PRESET_OPTIONS } from "@/utils/time";

interface Props {
  intervalPreset: string;
  intervalSeconds: number;
  validation: DeviceFormValidationErrors;
  onPresetChange: (value: string | null) => void;
  onCustomIntervalChange: (value: string | number) => void;
}

export default function ReportingSection({
  intervalPreset,
  intervalSeconds,
  validation,
  onPresetChange,
  onCustomIntervalChange,
}: Props) {
  const showCustomInterval = intervalPreset === "custom";

  return (
    <Stack gap="xs">
      <Title order={6}>Reporting</Title>
      <Select
        label="Reporting interval"
        description="How often the device wakes up and sends data"
        data={INTERVAL_PRESET_OPTIONS}
        value={intervalPreset}
        onChange={onPresetChange}
        error={validation.interval}
      />
      {showCustomInterval && (
        <NumberInput
          label="Custom interval (seconds)"
          description="For testing you can set a short interval (e.g. 10–60 seconds). Lower values use more battery."
          min={1}
          step={1}
          value={intervalSeconds}
          onChange={onCustomIntervalChange}
          error={validation.interval}
        />
      )}
      {showCustomInterval && Number.isFinite(intervalSeconds) && intervalSeconds >= 1 && (
        <Text size="xs" c="dimmed">
          ≈ {formatInterval(intervalSeconds)}
        </Text>
      )}
      {intervalSeconds < 60 && Number.isFinite(intervalSeconds) && (
        <Text size="xs" c="orange">
          Short intervals drain the battery faster.
        </Text>
      )}
    </Stack>
  );
}
