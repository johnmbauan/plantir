import {
  Table,
  Group,
  ActionIcon,
  Text,
  Badge,
  Anchor,
  Avatar,
  Tooltip,
} from "@mantine/core";
import { IconEdit, IconTrash, IconSun } from "@tabler/icons-react";
import type { EnrichedPlant } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { plantThumbnailUrl, speciesLabel } from "@/utils/plantDisplay";

interface PlantTableRowProps {
  plant: EnrichedPlant;
  onEdit: (plant: EnrichedPlant) => void;
  onDelete: (plant: EnrichedPlant) => void;
  onOpenDevice: (deviceId: number) => void;
  onAssignDevice: () => void;
}

export default function PlantTableRow({
  plant,
  onEdit,
  onDelete,
  onOpenDevice,
  onAssignDevice,
}: PlantTableRowProps) {
  const thumbnail = plantThumbnailUrl(plant);
  const species = speciesLabel(plant);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar src={thumbnail} radius="sm" size={36} alt="">
            {plant.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Group gap={6} wrap="nowrap">
              <Text fw={500} size="sm" lineClamp={1}>
                {plant.name}
              </Text>
              {plant.is_outdoor && (
                <Tooltip label="Outdoor plant" withArrow>
                  <Text component="span" display="inline-flex" lh={0} aria-label="Outdoor plant">
                    <IconSun size={14} color="var(--terracotta-500)" />
                  </Text>
                </Tooltip>
              )}
            </Group>
            {species && (
              <Text size="xs" c="dimmed" tt="capitalize" lineClamp={1}>
                {species}
              </Text>
            )}
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {plant.statuses.map((s) => (
            <Badge key={s} color={STATUS_CONFIG[s].color}>
              {STATUS_CONFIG[s].label}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        {plant.humidityPercent != null ? (
          <Group gap={4} wrap="nowrap">
            <Text size="sm" fw={500}>
              {plant.humidityPercent}%
            </Text>
            {plant.threshold != null && (
              <Text size="xs" c="dimmed">
                / {plant.threshold}%
              </Text>
            )}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td className="col-hide-mobile">
        {plant.serialNumber && plant.deviceId ? (
          <Anchor
            size="sm"
            ff="monospace"
            onClick={() => onOpenDevice(plant.deviceId!)}
            style={{ cursor: "pointer" }}
          >
            {plant.serialNumber}
          </Anchor>
        ) : (
          <Group gap={6} wrap="nowrap">
            <Text size="sm" c="dimmed">
              None
            </Text>
            <Anchor size="sm" onClick={onAssignDevice} style={{ cursor: "pointer" }}>
              Assign
            </Anchor>
          </Group>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Tooltip label="Edit plant" withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label="Edit plant"
              onClick={() => onEdit(plant)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete plant" withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Delete plant"
              onClick={() => onDelete(plant)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
