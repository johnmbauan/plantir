import {
  Table,
  Group,
  Text,
  Anchor,
  Avatar,
  Tooltip,
} from "@mantine/core";
import { IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { EnrichedPlant } from "@/types";
import PlantStatusChips from "@/components/shared/PlantStatusChips";
import FilterChip from "@/components/shared/FilterChip";
import IconEdit from "@/components/icons/IconEdit";
import IconTrash from "@/components/icons/IconTrash";
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
  const { t } = useTranslation();
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
                <Tooltip label={t("plantsTab.outdoorPlant")} withArrow>
                  <Text component="span" display="inline-flex" lh={0} aria-label={t("plantsTab.outdoorPlant")}>
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
          <PlantStatusChips statuses={plant.statuses} expanded />
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
              {t("common.none")}
            </Text>
            <Anchor size="sm" onClick={onAssignDevice} style={{ cursor: "pointer" }}>
              {t("plantsTab.assign")}
            </Anchor>
          </Group>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Tooltip label={t("plantsTab.editPlant")} withArrow>
            <FilterChip
              variant="edit"
              icon={<IconEdit size={12} />}
              label={t("plantsTab.editPlant")}
              iconOnly
              expandLabel={false}
              onClick={() => onEdit(plant)}
            />
          </Tooltip>
          <Tooltip label={t("plantsTab.deletePlant")} withArrow>
            <FilterChip
              variant="danger"
              icon={<IconTrash size={12} />}
              label={t("plantsTab.deletePlant")}
              iconOnly
              expandLabel={false}
              onClick={() => onDelete(plant)}
            />
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
