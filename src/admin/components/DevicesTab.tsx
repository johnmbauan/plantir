import { useMemo, useState } from "react";
import {
  Table,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { AdminDeviceSortKey } from "@/admin/adminService";
import { AdminDeviceRow } from "@/admin/components/AdminDeviceRow";
import { DevicesTabHeader } from "@/admin/components/DevicesTabHeader";
import { AdminTabLayout } from "@/admin/components/AdminTabLayout";
import { SortableTh } from "@/components/shared/SortableTh";
import { TableLoadingRows } from "@/components/shared/TableLoadingRows";
import { TablePagination } from "@/admin/components/TablePagination";
import { ADMIN_PAGE_SIZE } from "@/admin/constants";
import {
  buildOwnerOptions,
  buildPlantOptions,
  buildSerialOptions,
} from "@/admin/filterOptions";
import { useAdminDevicesPage } from "@/admin/hooks/useAdminDevicesPage";
import { useAdminFilterOptions } from "@/admin/hooks/useAdminFilterOptions";
import { paginationMeta } from "@/utils/pagination";
import type { SortDirection } from "@/utils/sort";

export function DevicesTab() {
  const { t } = useTranslation();
  const { filterOptions, refresh: refreshFilterOptions } = useAdminFilterOptions();

  const DEVICE_COLUMNS: { key: AdminDeviceSortKey; label: string }[] = [
    { key: "serialNumber", label: t("admin.devices.columns.serialNumber") },
    { key: "owner_email", label: t("admin.devices.columns.owner") },
    { key: "plantName", label: t("admin.devices.columns.plant") },
    { key: "type", label: t("admin.devices.columns.type") },
    { key: "lastHumidity", label: t("admin.devices.columns.humidity") },
    { key: "lastBattery", label: t("admin.devices.columns.battery") },
    { key: "lastSeenAt", label: t("admin.devices.columns.lastSeen") },
    { key: "firmwareVersion", label: t("admin.devices.columns.firmware") },
  ];
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<AdminDeviceSortKey>("lastSeenAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      serialNumber: selectedSerial,
      ownerEmail: selectedOwner,
      plantName: selectedPlant,
      sortKey,
      sortDir,
      page,
      pageSize: ADMIN_PAGE_SIZE,
    }),
    [selectedSerial, selectedOwner, selectedPlant, sortKey, sortDir, page],
  );

  const { items, totalCount, loading, refresh, currentPage } = useAdminDevicesPage(query);

  const pagination = useMemo(
    () => paginationMeta(totalCount, currentPage, ADMIN_PAGE_SIZE),
    [totalCount, currentPage],
  );

  const serialOptions = buildSerialOptions(filterOptions, t);
  const ownerOptions = buildOwnerOptions(filterOptions, t);
  const plantOptions = buildPlantOptions(filterOptions, t);
  const hasActiveFilters = selectedSerial || selectedOwner || selectedPlant;

  function handleRefresh() {
    void refresh();
    void refreshFilterOptions();
  }

  function handleSort(key: string) {
    const column = key as AdminDeviceSortKey;
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
    <DevicesTabHeader
      serialOptions={serialOptions}
      ownerOptions={ownerOptions}
      plantOptions={plantOptions}
      selectedSerial={selectedSerial}
      selectedOwner={selectedOwner}
      selectedPlant={selectedPlant}
      onSerialChange={(value) => handleFilterChange(setSelectedSerial, value)}
      onOwnerChange={(value) => handleFilterChange(setSelectedOwner, value)}
      onPlantChange={(value) => handleFilterChange(setSelectedPlant, value)}
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
      <Table.ScrollContainer minWidth={900}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              {DEVICE_COLUMNS.map((col) => (
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
                columnCount={DEVICE_COLUMNS.length}
              />
            ) : items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={DEVICE_COLUMNS.length}>
                  <Text ta="center" c="dimmed" py="xl" size="sm">
                    {hasActiveFilters
                      ? t("admin.devices.noMatch")
                      : t("admin.devices.noneRegistered")}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((device) => (
                <AdminDeviceRow
                  key={device.id}
                  device={device}
                  onOverrideCleared={() => void refresh()}
                />
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </AdminTabLayout>
  );
}
