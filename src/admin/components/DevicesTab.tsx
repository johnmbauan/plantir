import { useState } from "react";
import {
  Badge,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import type { AdminDevice } from "@/admin/adminService";
import { RefreshButton } from "@/admin/components/RefreshButton";
import { batteryColor, humidityColor } from "@/admin/utils";
import { relativeTime } from "@/utils/time";

interface DevicesTabProps {
  devices: AdminDevice[];
  loading: boolean;
  onRefresh: () => void;
}

export function DevicesTab({ devices, loading, onRefresh }: DevicesTabProps) {
  const [search, setSearch] = useState("");

  const visible = devices.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.serialNumber.toLowerCase().includes(q) ||
      (d.owner_email ?? "").toLowerCase().includes(q) ||
      (d.plantName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>All Devices</Text>
        <Group gap="xs">
          <TextInput
            placeholder="Filter by serial, owner or plant…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 280 }}
          />
          <RefreshButton onClick={onRefresh} label="Refresh devices" />
        </Group>
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Serial Number</Table.Th>
              <Table.Th>Owner</Table.Th>
              <Table.Th>Plant</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Humidity</Table.Th>
              <Table.Th>Battery</Table.Th>
              <Table.Th>Last Seen</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <Table.Td key={j}><Skeleton height={14} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : visible.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="xl" size="sm">
                    {devices.length === 0 ? "No devices registered." : "No devices match your filter."}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              visible.map((d) => (
                <Table.Tr key={d.id}>
                  <Table.Td fw={500} ff="monospace">{d.serialNumber}</Table.Td>
                  <Table.Td>
                    {d.owner_email
                      ? <Text size="sm">{d.owner_email}</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    {d.plantName
                      ? <Text size="sm">{d.plantName}</Text>
                      : <Text size="sm" c="dimmed">Unassigned</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="green" size="sm" style={{ textTransform: "capitalize" }}>
                      {d.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {d.lastHumidity !== null
                      ? <Text size="sm" c={humidityColor(d.lastHumidity)} fw={600}>{d.lastHumidity}%</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    {d.lastBattery !== null
                      ? <Text size="sm" c={batteryColor(d.lastBattery)} fw={600}>{d.lastBattery}%</Text>
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{relativeTime(d.lastSeenAt) ?? "—"}</Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
