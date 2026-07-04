import { useState } from "react";
import {
  Badge,
  Group,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import type { AdminDevice } from "@/admin/adminService";
import { RefreshButton } from "@/admin/components/RefreshButton";
import { useAdminLogs } from "@/admin/hooks/useAdminLogs";
import { LOG_LEVEL_COLOR } from "@/admin/utils";

interface LogsTabProps {
  devices: AdminDevice[];
}

export function LogsTab({ devices }: LogsTabProps) {
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const { logs, loading, refresh } = useAdminLogs(selectedSerial);

  const serialOptions = [
    { value: "", label: "All devices" },
    ...devices.map((d) => ({ value: d.serialNumber, label: d.serialNumber })),
  ];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>Device Logs</Text>
        <Group gap="xs">
          <Select
            data={serialOptions}
            value={selectedSerial ?? ""}
            onChange={(v) => setSelectedSerial(v || null)}
            placeholder="All devices"
            style={{ width: 240 }}
            clearable
          />
          <RefreshButton onClick={refresh} label="Refresh logs" />
        </Group>
      </Group>

      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Timestamp</Table.Th>
              <Table.Th>Serial</Table.Th>
              <Table.Th>Level</Table.Th>
              <Table.Th>Message</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <Table.Td key={j}><Skeleton height={14} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : logs.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="xl" size="sm">No logs found.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td style={{ whiteSpace: "nowrap" }}>
                    <Text size="sm" c="dimmed">{new Date(log.createdAt).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td ff="monospace">
                    <Text size="sm">{log.serialNumber}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={LOG_LEVEL_COLOR[log.level] ?? "gray"}
                      size="sm"
                      style={{ textTransform: "capitalize" }}
                    >
                      {log.level}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ wordBreak: "break-word" }}>{log.message}</Text>
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
