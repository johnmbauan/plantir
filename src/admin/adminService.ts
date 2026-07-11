import supabase from "@/supabase";
import type { SortDirection } from "@/utils/sort";

export type AdminDeviceSortKey =
  | "serialNumber"
  | "owner_email"
  | "plantName"
  | "type"
  | "lastHumidity"
  | "lastBattery"
  | "lastSeenAt";

export type AdminLogSortKey = "createdAt" | "serialNumber" | "level" | "message";

export interface AdminDevice {
  id: number;
  serialNumber: string;
  type: string;
  user_id: string;
  owner_email: string | null;
  plantName: string | null;
  lastHumidity: number | null;
  lastBattery: number | null;
  lastSeenAt: string | null;
}

export interface AdminLog {
  id: number;
  serialNumber: string;
  level: "error" | "warning" | "info";
  message: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}

export interface AdminDevicesQuery {
  serialNumber: string | null;
  ownerEmail: string | null;
  plantName: string | null;
  sortKey: AdminDeviceSortKey;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}

export interface AdminLogsQuery {
  serialNumber: string | null;
  ownerEmail: string | null;
  level: AdminLog["level"] | null;
  sortKey: AdminLogSortKey;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}

export interface AdminFilterOptions {
  serials: string[];
  owners: string[];
  plants: string[];
  hasUnassignedOwner: boolean;
  hasUnassignedPlant: boolean;
}

interface AdminFilterOptionsRpc {
  serials: string[];
  owners: string[];
  plants: string[];
  has_unassigned_owner: boolean;
  has_unassigned_plant: boolean;
}

interface PaginatedRpcResult<T> {
  items: T[];
  total_count: number;
}

function parsePaginatedResult<T>(data: unknown): PaginatedResult<T> {
  const result = (data ?? { items: [], total_count: 0 }) as PaginatedRpcResult<T>;
  return {
    items: result.items ?? [],
    totalCount: result.total_count ?? 0,
  };
}

function parseFilterOptions(data: unknown): AdminFilterOptions {
  const result = (data ?? {}) as Partial<AdminFilterOptionsRpc>;
  return {
    serials: result.serials ?? [],
    owners: result.owners ?? [],
    plants: result.plants ?? [],
    hasUnassignedOwner: result.has_unassigned_owner ?? false,
    hasUnassignedPlant: result.has_unassigned_plant ?? false,
  };
}

export async function fetchAdminFilterOptions(): Promise<AdminFilterOptions> {
  const { data, error } = await supabase.rpc("get_admin_device_filter_options");
  if (error) throw error;
  return parseFilterOptions(data);
}

export async function fetchAdminDevicesPage(
  query: AdminDevicesQuery,
): Promise<PaginatedResult<AdminDevice>> {
  const { data, error } = await supabase.rpc("get_admin_devices_page", {
    p_serial: query.serialNumber,
    p_owner_email: query.ownerEmail,
    p_plant_name: query.plantName,
    p_sort_column: query.sortKey,
    p_sort_asc: query.sortDir === "asc",
    p_page: query.page,
    p_page_size: query.pageSize,
  });
  if (error) throw error;
  return parsePaginatedResult<AdminDevice>(data);
}

export async function fetchAdminLogsPage(
  query: AdminLogsQuery,
): Promise<PaginatedResult<AdminLog>> {
  const { data, error } = await supabase.rpc("get_admin_logs_page", {
    p_serial: query.serialNumber,
    p_owner_email: query.ownerEmail,
    p_level: query.level,
    p_sort_column: query.sortKey,
    p_sort_asc: query.sortDir === "asc",
    p_page: query.page,
    p_page_size: query.pageSize,
  });
  if (error) throw error;
  return parsePaginatedResult<AdminLog>(data);
}
