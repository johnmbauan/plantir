import { Box, Group, Pagination, Text } from "@mantine/core";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  totalItems,
  loading = false,
  onPageChange,
}: TablePaginationProps) {
  if (!loading && totalItems === 0) return null;

  return (
    <Group justify="space-between" align="center" mih={36}>
      <Text size="sm" c="dimmed">
        {loading
          ? "Loading…"
          : `Showing ${rangeStart}–${rangeEnd} of ${totalItems}`}
      </Text>
      {!loading && totalPages > 1 && (
        <Pagination value={page} onChange={onPageChange} total={totalPages} />
      )}
    </Group>
  );
}
