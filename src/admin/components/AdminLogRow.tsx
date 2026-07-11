import { Badge, Table, Text } from "@mantine/core";
import type { AdminLog } from "@/admin/adminService";
import { LOG_LEVEL_COLOR } from "@/admin/constants";

interface AdminLogRowProps {
  log: AdminLog;
}

export function AdminLogRow({ log }: AdminLogRowProps) {
  return (
    <Table.Tr>
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
  );
}
