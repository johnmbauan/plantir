import { Table, Group, ActionIcon, Text, Tooltip, Anchor, Avatar, Badge } from "@mantine/core";
import { IconEdit, IconTrash, IconAdjustments } from "@tabler/icons-react";
import type { Device } from "@/types";
import { formatInterval } from "@/utils/time";
import { isDeviceCalibrated } from "@/components/DevicesTab/utils";

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
  const calibrated = isDeviceCalibrated(device);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Text fw={500} ff="monospace" size="sm">
            {device.serialNumber}
          </Text>
          {!calibrated && (
            <Badge color="orange" variant="light" size="sm">
              Needs calibration
            </Badge>
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
            Unassigned
          </Text>
        )}
      </Table.Td>
      <Table.Td className="col-hide-mobile">
        {device.humidityConfig ? (
          formatInterval(device.humidityConfig.sleepDurationSeconds)
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {device.type === "humidity" && (
            <Tooltip label={calibrated ? "Calibrate sensor" : "Calibrate sensor (required)"} withArrow>
              <ActionIcon
                variant={calibrated ? "subtle" : "light"}
                color={calibrated ? "green" : "orange"}
                aria-label="Calibrate sensor"
                onClick={() => onCalibrate(device)}
              >
                <IconAdjustments size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Edit device" withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label="Edit device"
              onClick={() => onEdit(device)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete device" withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Delete device"
              onClick={() => onDelete(device)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
