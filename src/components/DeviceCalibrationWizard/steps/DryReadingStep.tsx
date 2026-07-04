import { Stack, Text, Group, Button, Loader, ThemeIcon } from "@mantine/core";
import { IconSun } from "@tabler/icons-react";
import type { CalibrationReading } from "@/types";
import { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";
import ReadingCountdownBar from "./ReadingCountdownBar";

interface Props {
  pendingReading: CalibrationReading | null;
  timedOut: boolean;
  onAccept: () => void;
  onSkip: () => void;
  onRetry: () => void;
}

export default function DryReadingStep({ pendingReading, timedOut, onAccept, onSkip, onRetry }: Props) {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Dry reading</Text>
      <Text size="sm">
        Hold the <strong>black sensor tip</strong> in open air, away from any soil or water.
        Keep it there until you see a reading appear below.
      </Text>

      {timedOut ? (
        <Stack gap="xs" mt="xs">
          <Text size="sm" c="orange" fw={500}>
            No reading received. Make sure you pressed the reset button and the device connected to Wi-Fi.
          </Text>
          <Button variant="default" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </Stack>
      ) : pendingReading ? (
        <Stack gap="xs" mt="xs">
          <Group gap="xs" align="center">
            <ThemeIcon radius="xl" size="md" color="yellow" variant="light">
              <IconSun size={16} />
            </ThemeIcon>
            <Text size="xl" fw={700}>{pendingReading.rawValue}</Text>
            <Text size="sm" c="dimmed">dry</Text>
          </Group>
          <Text size="xs" c="dimmed">
            Typical reference: ~{DEFAULT_HUMIDITY_CONFIG.airValue} — values vary by sensor model.
          </Text>
          <Group gap="sm" mt="xs">
            <Button onClick={onAccept}>Use this reading</Button>
            <Button variant="default" onClick={onSkip}>Wait for the next one</Button>
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
