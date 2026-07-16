import { Badge, Group, NumberInput, Select, Stack, Text } from "@mantine/core";
import type { DeviceFormValidationErrors } from "@/components/DeviceFormModal/types";
import { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";
import { formatInterval, INTERVAL_PRESET_OPTIONS } from "@/utils/time";

const RECOMMENDED_INTERVAL = String(DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds);

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
      <Select
        label="Reporting interval"
        description={`How often the device wakes up and sends data. Higher frequencies drain the battery faster.`}
        data={INTERVAL_PRESET_OPTIONS}
        value={intervalPreset}
        onChange={onPresetChange}
        error={validation.interval}
        renderOption={({ option }) =>
          option.value === RECOMMENDED_INTERVAL ? (
            <Group justify="space-between" wrap="nowrap" gap="xs" w="100%">
              <span>{option.label}</span>
              <Badge size="xs" variant="light" color="green" style={{ flexShrink: 0 }}>
                Recommended
              </Badge>
            </Group>
          ) : (
            option.label
          )
        }
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
