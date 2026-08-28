import { Table, Group, Text, Anchor, Avatar, Tooltip } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Device } from "@/types";
import { formatInterval } from "@/utils/time";
import { isDeviceCalibrated } from "@/components/DevicesTab/utils";
import FilterChip from "@/components/shared/FilterChip";
import IconEdit from "@/components/icons/IconEdit";
import IconTrash from "@/components/icons/IconTrash";
import IconCalibrate from "@/components/icons/IconCalibrate";

interface DeviceTableRowProps {
  device: Device;
  plantImageUrl: string | null;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onCalibrate: (device: Device) => void;
  onOpenPlant: (plantId: number) => void;
}

export default function DeviceTableRow({
  device,
  plantImageUrl,
  onEdit,
  onDelete,
  onCalibrate,
  onOpenPlant,
}: DeviceTableRowProps) {
  const { t } = useTranslation();
  const calibrated = isDeviceCalibrated(device);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text fw={500} ff="monospace" size="sm">
            {device.serialNumber}
          </Text>
          {!calibrated && (
            <FilterChip
              variant="calibration"
              icon={<IconCalibrate size={12} />}
              label={t("devicesTab.calibrationRecommended")}
            />
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        {device.plantName && device.plantId != null ? (
          <Group
            gap="sm"
            wrap="nowrap"
            style={{ cursor: "pointer" }}
            onClick={() => onOpenPlant(device.plantId!)}
          >
            <Avatar src={plantImageUrl} radius="sm" size={36} alt={device.plantName}>
              {device.plantName.charAt(0).toUpperCase()}
            </Avatar>
            <Anchor size="sm" component="span">
              {device.plantName}
            </Anchor>
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            {t("devicesTab.unassigned")}
          </Text>
        )}
      </Table.Td>
      <Table.Td className="col-hide-mobile">
        {device.humidityConfig ? (
          formatInterval(device.humidityConfig.sleepDurationSeconds, t)
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          {device.type === "humidity" && (
            <Tooltip
              label={calibrated ? t("devicesTab.calibrateSensor") : t("devicesTab.calibrateSensorRequired")}
              withArrow
            >
              <FilterChip
                variant={calibrated ? "healthy" : "calibration"}
                icon={<IconCalibrate size={12} />}
                label={t("devicesTab.calibrateSensor")}
                iconOnly
                expandLabel={false}
                onClick={() => onCalibrate(device)}
              />
            </Tooltip>
          )}
          <Tooltip label={t("devicesTab.editDevice")} withArrow>
            <FilterChip
              variant="edit"
              icon={<IconEdit size={12} />}
              label={t("devicesTab.editDevice")}
              iconOnly
              expandLabel={false}
              onClick={() => onEdit(device)}
            />
          </Tooltip>
          <Tooltip label={t("devicesTab.deleteDevice")} withArrow>
            <FilterChip
              variant="danger"
              icon={<IconTrash size={12} />}
              label={t("devicesTab.deleteDevice")}
              iconOnly
              expandLabel={false}
              onClick={() => onDelete(device)}
            />
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
