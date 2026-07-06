import '@/test/mocks/supabase'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  resetSupabaseMocks,
  setupFromMocks,
  mockRpc,
} from '@/test/mocks/supabase'
import { fetchAdminDevices, fetchAdminLogs } from './adminService'

describe('adminService', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  describe('fetchAdminDevices', () => {
    it('returns devices from the admin RPC', async () => {
      const devices = [{ id: 1, serialNumber: 'SN-1', type: 'humidity' }]
      mockRpc.mockResolvedValue({ data: devices, error: null })

      await expect(fetchAdminDevices()).resolves.toEqual(devices)
      expect(mockRpc).toHaveBeenCalledWith('get_admin_devices')
    })

    it('throws when the RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('forbidden') })
      await expect(fetchAdminDevices()).rejects.toThrow('forbidden')
    })
  })

  describe('fetchAdminLogs', () => {
    it('returns logs from the database', async () => {
      const logs = [{ id: 1, serialNumber: 'SN-1', level: 'info', message: 'ok', createdAt: '2026-01-01' }]
      setupFromMocks({ device_logs: { data: logs, error: null } })

      await expect(fetchAdminLogs()).resolves.toEqual(logs)
    })

    it('filters logs by serial number when provided', async () => {
      setupFromMocks({ device_logs: { data: [], error: null } })
      await expect(fetchAdminLogs('SN-99')).resolves.toEqual([])
    })
  })
})
