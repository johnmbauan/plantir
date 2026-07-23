import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
} from '@/test/mocks/supabase';
import {
  fetchDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  pollPairingToken,
  createPairingBundle,
  startCalibrationMode,
  clearCalibrationMode,
  isCalibrationModeActive,
  getLatestCalibrationReading,
  saveCalibrationValues,
  type DeviceFormValues,
} from './deviceService';
import { mockInvoke } from '@/test/mocks/supabase';
import { DEFAULT_HUMIDITY_CONFIG } from '@/constants/deviceDefaults';

const formValues: DeviceFormValues = {
  serialNumber: 'SN-NEW',
  plantId: 1,
  type: 'humidity',
  humidityConfig: { ...DEFAULT_HUMIDITY_CONFIG },
};

describe('deviceService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('fetchDevices', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchDevices()).rejects.toThrow('Not authenticated');
    });

    it('returns enriched devices for the current user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        devices: {
          data: [{
            id: 1,
            serialNumber: 'SN-1',
            plantId: 2,
            type: 'humidity',
            plants: { name: 'Fern' },
            humidity_sensors_config: [{
              id: 10,
              minHumidityThreshold: 15,
              airValue: 2400,
              waterValue: 850,
              sleepDurationSeconds: 3600,
              calibrated_at: '2026-06-01T00:00:00Z',
            }],
          }],
          error: null,
        },
      });

      const devices = await fetchDevices();
      expect(devices[0]).toMatchObject({
        id: 1,
        serialNumber: 'SN-1',
        plantName: 'Fern',
        humidityConfig: expect.objectContaining({
          deviceId: 1,
          calibrated_at: '2026-06-01T00:00:00Z',
        }),
      });
    });
  });

  describe('createDevice', () => {
    it('creates a device and humidity config', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        devices: [
          { data: { id: 42 }, error: null },
          { data: null, error: null },
        ],
        humidity_sensors_config: { data: null, error: null },
      });

      await expect(createDevice(formValues)).resolves.toEqual({ id: 42 });
    });

    it('removes the device when humidity config insert fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        devices: [
          { data: { id: 42 }, error: null },
          { data: null, error: null },
        ],
        humidity_sensors_config: { data: null, error: new Error('config failed') },
      });

      await expect(createDevice(formValues)).rejects.toThrow('config failed');
    });
  });

  describe('deleteDevice', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(deleteDevice(1)).rejects.toThrow('Not authenticated');
    });

    it('deletes device for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ devices: { data: null, error: null } });
      await expect(deleteDevice(1)).resolves.toBeUndefined();
    });
  });

  describe('updateDevice', () => {
    it('updates device and existing humidity config', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        devices: { data: null, error: null },
        humidity_sensors_config: [
          { data: { id: 1 }, error: null },
          { data: null, error: null },
        ],
      });

      await expect(updateDevice(1, formValues)).resolves.toBeUndefined();
    });

    it('inserts humidity config when missing', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        devices: { data: null, error: null },
        humidity_sensors_config: [
          { data: null, error: null },
          { data: null, error: null },
        ],
      });

      await expect(updateDevice(1, formValues)).resolves.toBeUndefined();
    });
  });

  describe('createPairingBundle', () => {
    it('returns pairing bundle from edge function', async () => {
      const bundle = { tokenId: 't1', bundle: 'code', expiresAt: '2026-01-01' };
      mockInvoke.mockResolvedValue({ data: bundle, error: null });

      await expect(createPairingBundle(1)).resolves.toEqual(bundle);
    });

    it('throws on invalid response', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null });
      await expect(createPairingBundle()).rejects.toThrow('Failed to create pairing bundle');
    });
  });

  describe('calibration', () => {
    it('starts calibration mode', async () => {
      setupFromMocks({ humidity_sensors_config: { data: null, error: null } });
      await expect(startCalibrationMode(1)).resolves.toBeUndefined();
    });

    it('clears calibration mode', async () => {
      setupFromMocks({ humidity_sensors_config: { data: null, error: null } });
      await expect(clearCalibrationMode(1)).resolves.toBeUndefined();
    });

    it('reports whether calibration mode is active', async () => {
      setupFromMocks({
        humidity_sensors_config: {
          data: { calibrationModeStartedAt: '2026-01-01T00:00:00Z' },
          error: null,
        },
      });
      await expect(isCalibrationModeActive(1)).resolves.toBe(true);
    });

    it('reports inactive calibration mode when flag is cleared', async () => {
      setupFromMocks({
        humidity_sensors_config: {
          data: { calibrationModeStartedAt: null },
          error: null,
        },
      });
      await expect(isCalibrationModeActive(1)).resolves.toBe(false);
    });

    it('returns latest calibration reading', async () => {
      const reading = { id: 1, deviceId: 1, rawValue: 100, createdAt: '2026-01-01' };
      setupFromMocks({ calibration_readings: { data: reading, error: null } });
      await expect(getLatestCalibrationReading(1, '2026-01-01')).resolves.toEqual(reading);
    });

    it('saves calibration values and clears readings', async () => {
      setupFromMocks({
        humidity_sensors_config: { data: null, error: null },
        calibration_readings: { data: null, error: null },
      });
      await expect(saveCalibrationValues(1, 2400, 850)).resolves.toBeUndefined();
    });
  });

  describe('pollPairingToken', () => {
    it('returns used result when token is consumed', async () => {
      setupFromMocks({
        device_pairing_tokens: {
          data: {
            used_at: '2026-01-01',
            registered_device_id: 5,
            registered_serial_number: 'SN-5',
            failed_at: null,
            failure_reason: null,
          },
          error: null,
        },
      });

      await expect(pollPairingToken('token-1')).resolves.toEqual({
        used: true,
        failed: false,
        deviceId: 5,
        serialNumber: 'SN-5',
      });
    });

    it('returns failed result when pairing failed', async () => {
      setupFromMocks({
        device_pairing_tokens: {
          data: {
            used_at: null,
            registered_device_id: null,
            registered_serial_number: null,
            failed_at: '2026-01-01',
            failure_reason: 'timeout',
          },
          error: null,
        },
      });

      await expect(pollPairingToken('token-1')).resolves.toEqual({
        used: false,
        failed: true,
        failureReason: 'timeout',
      });
    });

    it('returns pending result when token is still open', async () => {
      setupFromMocks({
        device_pairing_tokens: {
          data: {
            used_at: null,
            registered_device_id: null,
            registered_serial_number: null,
            failed_at: null,
            failure_reason: null,
          },
          error: null,
        },
      });

      await expect(pollPairingToken('token-1')).resolves.toEqual({
        used: false,
        failed: false,
      });
    });
  });
});
