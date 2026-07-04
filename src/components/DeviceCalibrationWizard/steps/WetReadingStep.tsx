import { Stack, Text, Group, Button, Loader, ThemeIcon } from "@mantine/core";
import { IconSun, IconDroplet } from "@tabler/icons-react";
import type { CalibrationReading } from "@/types";
import { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";
import ReadingCountdownBar from "./ReadingCountdownBar";

interface Props {
  pendingReading: CalibrationReading | null;
  dryValue: number | null;
  timedOut: boolean;
  saving: boolean;
  onAccept: () => void;
  onSkip: () => void;
  onRetry: () => void;
}

export default function WetReadingStep({ pendingReading, dryValue, timedOut, saving, onAccept, onSkip, onRetry }: Props) {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Wet reading</Text>
      <Text size="sm">
        Gently lower <strong>just the black sensor tip</strong> into the glass of water.
        Do not submerge the rest of the device. Keep it there until a reading appears below.
      </Text>

      {timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            No reading received. The device may have finished its calibration window.
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            Restart calibration
          </Button>
        </Stack>
      ) : pendingReading ? (
        <Stack gap="xs" mt="xs">
          {dryValue !== null && (
            <Group gap="xs" align="center">
              <ThemeIcon radius="xl" size="md" color="yellow" variant="light">
                <IconSun size={16} />
              </ThemeIcon>
              <Text size="xl" fw={700} c="dimmed">{dryValue}</Text>
              <Text size="sm" c="dimmed">dry</Text>
            </Group>
          )}
          <Group gap="xs" align="center">
            <ThemeIcon radius="xl" size="md" color="blue" variant="light">
              <IconDroplet size={16} />
            </ThemeIcon>
            <Text size="xl" fw={700}>{pendingReading.rawValue}</Text>
            <Text size="sm" c="dimmed">wet</Text>
          </Group>
          <Text size="xs" c="dimmed">
            Typical reference: dry ~{DEFAULT_HUMIDITY_CONFIG.airValue} · wet ~{DEFAULT_HUMIDITY_CONFIG.waterValue} — values vary by sensor model.
          </Text>
          <Group gap="sm" mt="xs">
            <Button onClick={onAccept} loading={saving}>Use this reading</Button>
            <Button variant="default" onClick={onSkip} disabled={saving}>Wait for the next one</Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap={0} mt="xs">
          <Group gap="xs">
            <Loader size="xs" color="green" />
            <Text size="sm" c="dimmed">Waiting for a reading…</Text>
          </Group>
          <ReadingCountdownBar />
        </Stack>
      )}
    </Stack>
  );
}
