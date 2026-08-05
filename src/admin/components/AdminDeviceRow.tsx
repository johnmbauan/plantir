import { Badge, Button, Group, Stack, Table, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import type { AdminDevice } from "@/admin/adminService";
import { clearFirmwareOverrides } from "@/admin/adminService";
import {
  batteryMantineColor,
  humidityMantineColor,
} from "@/utils/color-utils";
import { relativeTime } from "@/utils/time";

interface AdminDeviceRowProps {
  device: AdminDevice;
  onOverrideCleared?: () => void;
}

export function AdminDeviceRow({ device, onOverrideCleared }: AdminDeviceRowProps) {
  const [clearing, setClearing] = useState(false);

  async function handleClearOverride() {
    setClearing(true);
    try {
      await clearFirmwareOverrides([device.id]);
      notifications.show({
        color: "green",
        title: "Override cleared",
        message: `${device.serialNumber} will follow the fleet channel.`,
      });
      onOverrideCleared?.();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Clear failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setClearing(false);
    }
  }

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
      <Table.Td>
        <Stack gap={4}>
          <Text size="sm" fw={device.firmwareVersion != null ? 600 : undefined} c={device.firmwareVersion == null ? "dimmed" : undefined}>
            {device.firmwareVersion != null ? `v${device.firmwareVersion}` : "—"}
            {device.firmwareBoard ? ` (${device.firmwareBoard})` : ""}
          </Text>
          {device.firmwareOverrideReleaseId != null && (
            <Group gap={6}>
              <Badge color="orange" variant="light" size="xs">
                Override v{device.firmwareOverrideVersion ?? "?"}
              </Badge>
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                loading={clearing}
                onClick={() => void handleClearOverride()}
              >
                Clear
              </Button>
            </Group>
          )}
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
