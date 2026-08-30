import supabase from "@/supabase";
import type { SortDirection } from "@/utils/sort";

export type FirmwareBoard = "esp32c5" | "esp32c6";

export type AdminDeviceSortKey =
  | "serialNumber"
  | "owner_email"
  | "plantName"
  | "type"
  | "lastHumidity"
  | "lastBattery"
  | "lastSeenAt"
  | "firmwareVersion";

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
  firmwareVersion: number | null;
  firmwareBoard: string | null;
  firmwareReportedAt: string | null;
  firmwareOverrideReleaseId: number | null;
  firmwareOverrideVersion: number | null;
}

export interface FirmwareRelease {
  id: number;
  board: FirmwareBoard;
  version: number;
  semver: string;
  binary_url: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirmwareChannel {
  board: FirmwareBoard;
  release_id: number;
  updatedAt: string;
  release?: FirmwareRelease | null;
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

const FIRMWARE_BUCKET = "firmware";

export async function fetchFirmwareReleases(): Promise<FirmwareRelease[]> {
  const { data, error } = await supabase
    .from("firmware_releases")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FirmwareRelease[];
}

export async function fetchFirmwareChannels(): Promise<FirmwareChannel[]> {
  const { data, error } = await supabase
    .from("firmware_channels")
    .select("*, release:firmware_releases(*)");
  if (error) throw error;
  return (data ?? []) as FirmwareChannel[];
}

export async function uploadFirmwareRelease(
  board: FirmwareBoard,
  version: number,
  semver: string,
  file: File,
  label?: string | null,
): Promise<FirmwareRelease> {
  const path = `${board}/${version}.bin`;
  const { error: uploadError } = await supabase.storage
    .from(FIRMWARE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: "application/octet-stream",
    });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(FIRMWARE_BUCKET)
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("firmware_releases")
    .upsert(
      {
        board,
        version,
        semver: semver.trim(),
        binary_url: publicUrlData.publicUrl,
        label: label?.trim() || null,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "board,version" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as FirmwareRelease;
}

export async function publishFirmwareToFleet(
  board: FirmwareBoard,
  releaseId: number,
): Promise<void> {
  const { error } = await supabase.from("firmware_channels").upsert(
    {
      board,
      release_id: releaseId,
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "board" },
  );
  if (error) throw error;
}

export async function assignFirmwareOverride(
  deviceIds: number[],
  releaseId: number,
): Promise<void> {
  if (deviceIds.length === 0) return;
  const { error } = await supabase.rpc("admin_assign_firmware_override", {
    p_device_ids: deviceIds,
    p_release_id: releaseId,
  });
  if (error) throw error;
}

export async function clearFirmwareOverrides(deviceIds: number[]): Promise<void> {
  if (deviceIds.length === 0) return;
  const { error } = await supabase.rpc("admin_clear_firmware_overrides", {
    p_device_ids: deviceIds,
  });
  if (error) throw error;
}

export async function clearFirmwareOverridesForRelease(releaseId: number): Promise<void> {
  const { error } = await supabase.rpc("admin_clear_firmware_overrides_for_release", {
    p_release_id: releaseId,
  });
  if (error) throw error;
}

export async function fetchAdminDevicesForBoard(
  board: FirmwareBoard,
): Promise<Pick<AdminDevice, "id" | "serialNumber" | "firmwareBoard" | "firmwareVersion" | "firmwareOverrideReleaseId">[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("id, serialNumber, firmwareBoard, firmwareVersion, firmwareOverrideReleaseId")
    .or(`firmwareBoard.eq.${board},firmwareBoard.is.null`)
    .order("serialNumber", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pick<
    AdminDevice,
    "id" | "serialNumber" | "firmwareBoard" | "firmwareVersion" | "firmwareOverrideReleaseId"
  >[];
}
