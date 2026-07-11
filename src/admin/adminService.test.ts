import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetSupabaseMocks,
  mockRpc,
} from '@/test/mocks/supabase';
import {
  fetchAdminFilterOptions,
  fetchAdminDevicesPage,
  fetchAdminLogsPage,
} from './adminService';
import { ADMIN_PAGE_SIZE } from './constants';

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
});
