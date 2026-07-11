import { Badge, Table, Text } from "@mantine/core";
import type { AdminDevice } from "@/admin/adminService";
import {
  batteryMantineColor,
  humidityMantineColor,
} from "@/utils/color-utils";
import { relativeTime } from "@/utils/time";

interface AdminDeviceRowProps {
  device: AdminDevice;
}

export function AdminDeviceRow({ device }: AdminDeviceRowProps) {
  return (
    <Table.Tr>
      <Table.Td fw={500} ff="monospace">{device.serialNumber}</Table.Td>
      <Table.Td>
        {device.owner_email
          ? <Text size="sm">{device.owner_email}</Text>
          : <Text size="sm" c="dimmed">—</Text>}
      </Table.Td>
      <Table.Td>
        {device.plantName
          ? <Text size="sm">{device.plantName}</Text>
          : <Text size="sm" c="dimmed">Unassigned</Text>}
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="green" size="sm" style={{ textTransform: "capitalize" }}>
          {device.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        {device.lastHumidity !== null
          ? <Text size="sm" c={humidityMantineColor(device.lastHumidity)} fw={600}>{device.lastHumidity}%</Text>
          : <Text size="sm" c="dimmed">—</Text>}
      </Table.Td>
      <Table.Td>
        {device.lastBattery !== null
          ? <Text size="sm" c={batteryMantineColor(device.lastBattery)} fw={600}>{device.lastBattery}%</Text>
          : <Text size="sm" c="dimmed">—</Text>}
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">{relativeTime(device.lastSeenAt) ?? "—"}</Text>
      </Table.Td>
    </Table.Tr>
  );
}
