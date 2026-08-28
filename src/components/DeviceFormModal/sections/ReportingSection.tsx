import { Badge, Group, NumberInput, Select, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { DeviceFormValidationErrors } from "@/components/DeviceFormModal/types";
import { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";
import { formatInterval, getIntervalPresetOptions } from "@/utils/time";

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
  const { t } = useTranslation();
  const showCustomInterval = intervalPreset === "custom";

  return (
    <Stack gap="xs">
      <Select
        label={t("deviceForm.reportingInterval")}
        description={t("deviceForm.reportingIntervalDescription")}
        data={getIntervalPresetOptions(t)}
        value={intervalPreset}
        onChange={onPresetChange}
        error={validation.interval}
        renderOption={({ option }) =>
          option.value === RECOMMENDED_INTERVAL ? (
            <Group justify="space-between" wrap="nowrap" gap="xs" w="100%">
              <span>{option.label}</span>
              <Badge size="xs" variant="light" color="green" style={{ flexShrink: 0 }}>
                {t("deviceForm.recommended")}
              </Badge>
            </Group>
          ) : (
            option.label
          )
        }
      />
      {showCustomInterval && (
        <NumberInput
          label={t("deviceForm.customInterval")}
          description={t("deviceForm.customIntervalDescription")}
          min={1}
          step={1}
          value={intervalSeconds}
          onChange={onCustomIntervalChange}
          error={validation.interval}
        />
      )}
      {showCustomInterval && Number.isFinite(intervalSeconds) && intervalSeconds >= 1 && (
        <Text size="xs" c="dimmed">
          ≈ {formatInterval(intervalSeconds, t)}
        </Text>
      )}
      {intervalSeconds < 60 && Number.isFinite(intervalSeconds) && (
        <Text size="xs" c="orange">
          {t("deviceForm.shortIntervalWarning")}
        </Text>
      )}
    </Stack>
  );
}
