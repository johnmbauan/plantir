import { useMemo, useState } from "react";
import {
  Table,
  Text,
} from "@mantine/core";
import type { AdminLogSortKey } from "@/admin/adminService";
import { AdminLogRow } from "@/admin/components/AdminLogRow";
import { AdminTabLayout } from "@/admin/components/AdminTabLayout";
import { LogsTabHeader } from "@/admin/components/LogsTabHeader";
import { SortableTh } from "@/components/shared/SortableTh";
import { TableLoadingRows } from "@/components/shared/TableLoadingRows";
import { TablePagination } from "@/admin/components/TablePagination";
import { ADMIN_PAGE_SIZE } from "@/admin/constants";
import {
  buildOwnerOptions,
  buildSerialOptions,
} from "@/admin/filterOptions";
import { useAdminFilterOptions } from "@/admin/hooks/useAdminFilterOptions";
import { useAdminLogsPage } from "@/admin/hooks/useAdminLogsPage";
import { paginationMeta } from "@/utils/pagination";
import type { SortDirection } from "@/utils/sort";

const LOG_COLUMNS: { key: AdminLogSortKey; label: string }[] = [
  { key: "createdAt", label: "Timestamp" },
  { key: "serialNumber", label: "Serial" },
  { key: "level", label: "Level" },
  { key: "message", label: "Message" },
];

export function LogsTab() {
  const { filterOptions, refresh: refreshFilterOptions } = useAdminFilterOptions();
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<AdminLogSortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      serialNumber: selectedSerial,
      ownerEmail: selectedOwner,
      level: selectedLevel as "error" | "warning" | "info" | null,
      sortKey,
      sortDir,
      page,
      pageSize: ADMIN_PAGE_SIZE,
    }),
    [selectedSerial, selectedOwner, selectedLevel, sortKey, sortDir, page],
  );

  const { items, totalCount, loading, refresh, currentPage } = useAdminLogsPage(query);

  const pagination = useMemo(
    () => paginationMeta(totalCount, currentPage, ADMIN_PAGE_SIZE),
    [totalCount, currentPage],
  );

  const serialOptions = buildSerialOptions(filterOptions);
  const ownerOptions = buildOwnerOptions(filterOptions);
  const hasActiveFilters = selectedSerial || selectedOwner || selectedLevel;

  function handleRefresh() {
    void refresh();
    void refreshFilterOptions();
  }

  function handleSort(key: string) {
    const column = key as AdminLogSortKey;
    if (sortKey === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleFilterChange(
    setter: (value: string | null) => void,
    value: string | null,
  ) {
    setter(value);
    setPage(1);
  }

  const header = (
    <LogsTabHeader
      serialOptions={serialOptions}
      ownerOptions={ownerOptions}
      selectedSerial={selectedSerial}
      selectedOwner={selectedOwner}
      selectedLevel={selectedLevel}
      onSerialChange={(value) => handleFilterChange(setSelectedSerial, value)}
      onOwnerChange={(value) => handleFilterChange(setSelectedOwner, value)}
      onLevelChange={(value) => handleFilterChange(setSelectedLevel, value)}
      onRefresh={handleRefresh}
    />
  );

  const footer = (
    <TablePagination
      page={currentPage}
      totalPages={pagination.totalPages}
      rangeStart={pagination.rangeStart}
      rangeEnd={pagination.rangeEnd}
      totalItems={totalCount}
      loading={loading}
      onPageChange={setPage}
    />
  );

  return (
    <AdminTabLayout header={header} footer={footer}>
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              {LOG_COLUMNS.map((col) => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  columnKey={col.key}
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                />
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <TableLoadingRows
                rowCount={ADMIN_PAGE_SIZE}
                columnCount={LOG_COLUMNS.length}
              />
            ) : items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="xl" size="sm">
                    {hasActiveFilters
                      ? "No logs match your filters."
                      : "No logs found."}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((log) => (
                <AdminLogRow key={log.id} log={log} />
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </AdminTabLayout>
  );
}
