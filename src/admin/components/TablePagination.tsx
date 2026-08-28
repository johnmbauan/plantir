import { Group, Pagination, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  if (!loading && totalItems === 0) return null;

  return (
    <Group justify="space-between" align="center" mih={36}>
      <Text size="sm" c="dimmed">
        {loading
          ? t("admin.pagination.loading")
          : t("admin.pagination.showing", {
              start: rangeStart,
              end: rangeEnd,
              total: totalItems,
            })}
      </Text>
      {!loading && totalPages > 1 && (
        <Pagination value={page} onChange={onPageChange} total={totalPages} />
      )}
    </Group>
  );
}
