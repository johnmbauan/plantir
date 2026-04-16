import { Modal, Image, Group, Text, Stack, Anchor, Box, Badge } from "@mantine/core";
import { Link } from "react-router-dom";
import type { EnrichedPlant } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { formatInterval } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";

interface Props {
  plant: EnrichedPlant | null;
  opened: boolean;
  onClose: () => void;
}

export default function PlantDetailModal({ plant, opened, onClose }: Props) {
  if (!plant) return null;

  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>{plant.name}</Text>} size="md">
      <Stack gap="md">
        {/* Image */}
        {plant.image_url ? (
          <Image src={plant.image_url} alt={plant.name} radius="md" h={400} fit="contain" />
        ) : (
          <Box ta="center" py="md" style={{ fontSize: 72 }}>🪴</Box>
        )}

        {/* Status badges */}
        <Group gap={6}>
          {plant.statuses.map((s) => (
            <Badge key={s} color={STATUS_CONFIG[s].color} variant="light">
              {STATUS_CONFIG[s].label}
            </Badge>
          ))}
        </Group>

        {/* Humidity bar */}
        <Stack gap={6}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Humidity</Text>
            <Text size="sm" fw={600}>
              {plant.humidityPercent != null ? `${plant.humidityPercent}%` : "—"}
            </Text>
          </Group>
          <HumidityBar
            humidityPercent={plant.humidityPercent}
            threshold={plant.threshold}
            barColor={barColor}
          />
        </Stack>

        {/* Reporting interval */}
        {plant.sleepDurationSeconds != null && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Reporting interval</Text>
            <Text size="sm" fw={600}>{formatInterval(plant.sleepDurationSeconds)}</Text>
          </Group>
        )}

        {/* Action links */}
        <Group gap="lg" mt="xs">
          <Anchor component={Link} size="sm" to={`/plants-center?tab=plants&plantId=${plant.id}`} onClick={onClose}>
            ✏️ Edit plant
          </Anchor>
          {plant.deviceId != null && (
            <Anchor component={Link} size="sm" to={`/plants-center?tab=devices&deviceId=${plant.deviceId}`} onClick={onClose}>
              🔧 Edit device
            </Anchor>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
