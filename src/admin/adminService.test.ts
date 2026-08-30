import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetSupabaseMocks,
  mockRpc,
  mockFrom,
  mockStorageFrom,
  createQueryChain,
  setupFromMocks,
} from '@/test/mocks/supabase';
import {
  fetchAdminFilterOptions,
  fetchAdminDevicesPage,
  fetchAdminLogsPage,
  fetchFirmwareReleases,
  fetchFirmwareChannels,
  uploadFirmwareRelease,
  publishFirmwareToFleet,
  assignFirmwareOverride,
  clearFirmwareOverrides,
  clearFirmwareOverridesForRelease,
  fetchAdminDevicesForBoard,
  type FirmwareRelease,
} from './adminService';
import { ADMIN_PAGE_SIZE } from './constants';

const sampleRelease: FirmwareRelease = {
  id: 10,
  board: 'esp32c6',
  version: 2,
  semver: '1.2.0',
  binary_url: 'https://cdn/firmware/esp32c6/2.bin',
  label: 'pilot',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('adminService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('fetchAdminFilterOptions', () => {
    it('returns filter options from the admin RPC', async () => {
      const options = {
        serials: ['SN-1'],
        owners: ['alice@example.com'],
        plants: ['Monstera'],
        has_unassigned_owner: false,
        has_unassigned_plant: true,
      };
      mockRpc.mockResolvedValue({ data: options, error: null });

      await expect(fetchAdminFilterOptions()).resolves.toEqual({
        serials: ['SN-1'],
        owners: ['alice@example.com'],
        plants: ['Monstera'],
        hasUnassignedOwner: false,
        hasUnassignedPlant: true,
      });
      expect(mockRpc).toHaveBeenCalledWith('get_admin_device_filter_options');
    });

    it('throws when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('forbidden') });
      await expect(fetchAdminFilterOptions()).rejects.toThrow('forbidden');
    });
  });

  describe('fetchAdminDevicesPage', () => {
    it('returns a paginated result from the admin RPC', async () => {
      const page = {
        items: [{ id: 1, serialNumber: 'SN-1', type: 'humidity' }],
        total_count: 42,
      };
      mockRpc.mockResolvedValue({ data: page, error: null });

      await expect(fetchAdminDevicesPage({
        serialNumber: 'SN-1',
        ownerEmail: 'alice@example.com',
        plantName: 'Monstera',
        sortKey: 'serialNumber',
        sortDir: 'asc',
        page: 2,
        pageSize: ADMIN_PAGE_SIZE,
      })).resolves.toEqual({
        items: page.items,
        totalCount: 42,
      });

      expect(mockRpc).toHaveBeenCalledWith('get_admin_devices_page', {
        p_serial: 'SN-1',
        p_owner_email: 'alice@example.com',
        p_plant_name: 'Monstera',
        p_sort_column: 'serialNumber',
        p_sort_asc: true,
        p_page: 2,
        p_page_size: ADMIN_PAGE_SIZE,
      });
    });
  });

  describe('fetchAdminLogsPage', () => {
    it('returns a paginated result from the admin RPC', async () => {
      const page = {
        items: [{ id: 1, serialNumber: 'SN-1', level: 'info', message: 'ok', createdAt: '2026-01-01' }],
        total_count: 10,
      };
      mockRpc.mockResolvedValue({ data: page, error: null });

      await expect(fetchAdminLogsPage({
        serialNumber: 'SN-1',
        ownerEmail: 'alice@example.com',
        level: 'error',
        sortKey: 'createdAt',
        sortDir: 'desc',
        page: 1,
        pageSize: ADMIN_PAGE_SIZE,
      })).resolves.toEqual({
        items: page.items,
        totalCount: 10,
      });

      expect(mockRpc).toHaveBeenCalledWith('get_admin_logs_page', {
        p_serial: 'SN-1',
        p_owner_email: 'alice@example.com',
        p_level: 'error',
        p_sort_column: 'createdAt',
        p_sort_asc: false,
        p_page: 1,
        p_page_size: ADMIN_PAGE_SIZE,
      });
    });
  });

  describe('fetchFirmwareReleases', () => {
    it('returns releases ordered by creation date, newest first', async () => {
      const chain = createQueryChain({ data: [sampleRelease], error: null });
      mockFrom.mockImplementation((name: string) =>
        name === 'firmware_releases' ? chain : createQueryChain(),
      );

      await expect(fetchFirmwareReleases()).resolves.toEqual([sampleRelease]);
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.order).toHaveBeenCalledWith('createdAt', { ascending: false });
    });

    it('throws when the query fails', async () => {
      setupFromMocks({
        firmware_releases: { data: null, error: new Error('denied') },
      });
      await expect(fetchFirmwareReleases()).rejects.toThrow('denied');
    });
  });

  describe('fetchFirmwareChannels', () => {
    it('returns channels with joined release rows', async () => {
      const channels = [{
        board: 'esp32c6',
        release_id: 10,
        updatedAt: '2026-08-01T00:00:00Z',
        release: sampleRelease,
      }];
      const chain = createQueryChain({ data: channels, error: null });
      mockFrom.mockImplementation((name: string) =>
        name === 'firmware_channels' ? chain : createQueryChain(),
      );

      await expect(fetchFirmwareChannels()).resolves.toEqual(channels);
      expect(chain.select).toHaveBeenCalledWith('*, release:firmware_releases(*)');
    });
  });

  describe('uploadFirmwareRelease', () => {
    it('uploads the binary, upserts the release, and returns the row', async () => {
      const upload = vi.fn().mockResolvedValue({ error: null });
      const getPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: sampleRelease.binary_url },
      });
      mockStorageFrom.mockReturnValue({ upload, getPublicUrl });

      const chain = createQueryChain({ data: sampleRelease, error: null });
      mockFrom.mockImplementation((name: string) =>
        name === 'firmware_releases' ? chain : createQueryChain(),
      );

      const file = new File(['bin'], 'firmware.bin', { type: 'application/octet-stream' });
      await expect(
        uploadFirmwareRelease('esp32c6', 2, ' 1.2.0 ', file, ' pilot '),
      ).resolves.toEqual(sampleRelease);

      expect(mockStorageFrom).toHaveBeenCalledWith('firmware');
      expect(upload).toHaveBeenCalledWith('esp32c6/2.bin', file, {
        upsert: true,
        contentType: 'application/octet-stream',
      });
      expect(getPublicUrl).toHaveBeenCalledWith('esp32c6/2.bin');
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          board: 'esp32c6',
          version: 2,
          semver: '1.2.0',
          binary_url: sampleRelease.binary_url,
          label: 'pilot',
        }),
        { onConflict: 'board,version' },
      );
    });

    it('stores a null label when omitted', async () => {
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: sampleRelease.binary_url },
        }),
      });
      const chain = createQueryChain({
        data: { ...sampleRelease, label: null },
        error: null,
      });
      mockFrom.mockImplementation((name: string) =>
        name === 'firmware_releases' ? chain : createQueryChain(),
      );

      const file = new File(['bin'], 'firmware.bin');
      await uploadFirmwareRelease('esp32c5', 1, '1.0.0', file);

      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ board: 'esp32c5', version: 1, label: null }),
        { onConflict: 'board,version' },
      );
    });

    it('throws when storage upload fails', async () => {
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: new Error('quota') }),
        getPublicUrl: vi.fn(),
      });

      const file = new File(['bin'], 'firmware.bin');
      await expect(
        uploadFirmwareRelease('esp32c6', 2, '1.2.0', file),
      ).rejects.toThrow('quota');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('throws when the release upsert fails', async () => {
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: sampleRelease.binary_url },
        }),
      });
      setupFromMocks({
        firmware_releases: { data: null, error: new Error('conflict') },
      });

      const file = new File(['bin'], 'firmware.bin');
      await expect(
        uploadFirmwareRelease('esp32c6', 2, '1.2.0', file),
      ).rejects.toThrow('conflict');
    });
  });

  describe('publishFirmwareToFleet', () => {
    it('upserts the fleet channel for the board', async () => {
      const chain = createQueryChain({ data: null, error: null });
      mockFrom.mockImplementation((name: string) =>
        name === 'firmware_channels' ? chain : createQueryChain(),
      );

      await expect(publishFirmwareToFleet('esp32c6', 10)).resolves.toBeUndefined();
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ board: 'esp32c6', release_id: 10 }),
        { onConflict: 'board' },
      );
    });

    it('throws when the channel upsert fails', async () => {
      setupFromMocks({
        firmware_channels: { data: null, error: new Error('denied') },
      });
      await expect(publishFirmwareToFleet('esp32c5', 1)).rejects.toThrow('denied');
    });
  });

  describe('assignFirmwareOverride', () => {
    it('calls the admin assign RPC', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(assignFirmwareOverride([1, 2], 10)).resolves.toBeUndefined();
      expect(mockRpc).toHaveBeenCalledWith('admin_assign_firmware_override', {
        p_device_ids: [1, 2],
        p_release_id: 10,
      });
    });

    it('no-ops when deviceIds is empty', async () => {
      await expect(assignFirmwareOverride([], 10)).resolves.toBeUndefined();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('throws when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('denied') });
      await expect(assignFirmwareOverride([1], 10)).rejects.toThrow('denied');
    });
  });

  describe('clearFirmwareOverrides', () => {
    it('calls the admin clear RPC', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(clearFirmwareOverrides([3])).resolves.toBeUndefined();
      expect(mockRpc).toHaveBeenCalledWith('admin_clear_firmware_overrides', {
        p_device_ids: [3],
      });
    });

    it('no-ops when deviceIds is empty', async () => {
      await expect(clearFirmwareOverrides([])).resolves.toBeUndefined();
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe('clearFirmwareOverridesForRelease', () => {
    it('calls the admin clear-for-release RPC', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(clearFirmwareOverridesForRelease(10)).resolves.toBeUndefined();
      expect(mockRpc).toHaveBeenCalledWith('admin_clear_firmware_overrides_for_release', {
        p_release_id: 10,
      });
    });
  });

  describe('fetchAdminDevicesForBoard', () => {
    it('returns devices for the board including unset firmwareBoard', async () => {
      const devices = [{
        id: 1,
        serialNumber: 'SN-1',
        firmwareBoard: 'esp32c6',
        firmwareVersion: 1,
        firmwareOverrideReleaseId: null,
      }];
      const chain = createQueryChain({ data: devices, error: null });
      mockFrom.mockImplementation((name: string) =>
        name === 'devices' ? chain : createQueryChain(),
      );

      await expect(fetchAdminDevicesForBoard('esp32c6')).resolves.toEqual(devices);
      expect(chain.select).toHaveBeenCalledWith(
        'id, serialNumber, firmwareBoard, firmwareVersion, firmwareOverrideReleaseId',
      );
      expect(chain.or).toHaveBeenCalledWith(
        'firmwareBoard.eq.esp32c6,firmwareBoard.is.null',
      );
      expect(chain.order).toHaveBeenCalledWith('serialNumber', { ascending: true });
    });

    it('returns an empty array when data is null', async () => {
      setupFromMocks({ devices: { data: null, error: null } });
      await expect(fetchAdminDevicesForBoard('esp32c5')).resolves.toEqual([]);
    });
  });
});
