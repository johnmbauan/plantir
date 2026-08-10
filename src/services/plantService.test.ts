import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
  mockStorageFrom,
  mockRpc,
} from '@/test/mocks/supabase';
import {
  fetchPlants,
  createPlant,
  updatePlant,
  deletePlant,
  fetchPlantHistory,
  fetchLastWateredAt,
  fetchPlantStatusesByIds,
  uploadPlantImage,
  deletePlantImage,
} from './plantService';

vi.mock('@/utils/imageVariants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/imageVariants')>();
  return {
    ...actual,
    prepareImageVariants: vi.fn(async () => ({
      full: new File(['full'], 'id.jpg', { type: 'image/jpeg' }),
      thumb: new File(['thumb'], 'id_thumb.jpg', { type: 'image/jpeg' }),
    })),
  };
});

function mockUserPlants(plants: unknown[]) {
  mockRpc.mockResolvedValue({ data: plants, error: null });
}

describe('plantService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchPlants', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchPlants()).rejects.toThrow('Not authenticated');
    });

    it('returns enriched plants sorted by humidity', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'B',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidityPercentage: 40,
          humidity_created_at: '2026-07-06T11:00:00Z',
          batteryPercent: 90,
          battery_created_at: '2026-07-06T11:00:00Z',
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0]).toMatchObject({
        name: 'B',
        humidityPercent: 40,
        statuses: ['HEALTHY'],
      });
      expect(mockRpc).toHaveBeenCalledWith('get_user_plants', {
        p_plant_ids: null,
      });
    });

    it('maps serialNumber from the humidity device', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'Fern',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-FERN',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidityPercentage: 50,
          humidity_created_at: '2026-07-06T11:00:00Z',
          batteryPercent: null,
          battery_created_at: null,
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0].serialNumber).toBe('SN-FERN');
    });

    it('sets serialNumber to null when plant has no device', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'No Device',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [],
      }]);

      const plants = await fetchPlants();
      expect(plants[0].serialNumber).toBeNull();
    });

    it('maps species summary when available', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'Ficus',
        imageUrl: null,
        createdAt: '2026-01-01',
        species_id: 7,
        plant_species: {
          id: 7,
          source: 'openplantbook',
          sourceSpeciesId: 'ficus_lyrata',
          scientificName: 'Ficus lyrata',
          displayName: 'Fiddle leaf fig',
          imageUrl: null,
          minSoilMoisture: 30,
          maxSoilMoisture: 55,
          minTemperatureCelsius: 18,
          maxTemperatureCelsius: 27,
          sunlight: 'Bright indirect',
          soil: 'Well draining',
          watering: 'Keep slightly moist',
          fertilization: 'Monthly',
          pruning: 'Spring',
        },
        devices: [],
      }]);

      const plants = await fetchPlants();

      expect(plants[0]).toMatchObject({
        speciesId: 7,
        species: expect.objectContaining({
          id: 7,
          sourceSpeciesId: 'ficus_lyrata',
          minSoilMoisture: 30,
          minTemperatureCelsius: 18,
          sunlight: 'Bright indirect',
        }),
      });
    });

    it('marks plants needing water and offline', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'Dry',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 30, sleepDurationSeconds: 3600 }],
          humidityPercentage: 10,
          humidity_created_at: '2026-07-05T08:00:00Z',
          batteryPercent: 5,
          battery_created_at: '2026-07-05T08:00:00Z',
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0].statuses).toEqual(expect.arrayContaining(['OFFLINE', 'WATERING_NEEDED', 'RECHARGE_NEEDED']));
    });

    it('returns offline plant without humidity device', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'No device',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [],
      }]);

      const plants = await fetchPlants();
      expect(plants[0].statuses).toEqual(['OFFLINE']);
    });

    it('sorts plants with null humidity after those with readings', async () => {
      mockAuthenticatedUser();
      mockUserPlants([
        {
          id: 1,
          name: 'Alpha',
          imageUrl: null,
          createdAt: '2026-01-01',
          devices: [{
            id: 10,
            serialNumber: 'SN-10',
            humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            humidityPercentage: 30,
            humidity_created_at: '2026-07-06T11:00:00Z',
            batteryPercent: null,
            battery_created_at: null,
          }],
        },
        {
          id: 2,
          name: 'Beta',
          imageUrl: null,
          createdAt: '2026-01-01',
          devices: [{
            id: 20,
            serialNumber: 'SN-20',
            humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            humidityPercentage: 60,
            humidity_created_at: '2026-07-06T11:00:00Z',
            batteryPercent: null,
            battery_created_at: null,
          }],
        },
        {
          id: 3,
          name: 'Gamma',
          imageUrl: null,
          createdAt: '2026-01-01',
          devices: [],
        },
      ]);

      const plants = await fetchPlants();
      expect(plants.map((p) => p.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
    });

    it('sorts two null-humidity plants alphabetically', async () => {
      mockAuthenticatedUser();
      mockUserPlants([
        { id: 1, name: 'Zebra', imageUrl: null, createdAt: '2026-01-01', devices: [] },
        { id: 2, name: 'Apple', imageUrl: null, createdAt: '2026-01-01', devices: [] },
      ]);

      const plants = await fetchPlants();
      expect(plants.map((p) => p.name)).toEqual(['Apple', 'Zebra']);
    });

    it('sorts equal-humidity plants alphabetically', async () => {
      mockAuthenticatedUser();
      mockUserPlants([
        {
          id: 1,
          name: 'Zinnia',
          imageUrl: null,
          createdAt: '2026-01-01',
          devices: [{
            id: 10,
            serialNumber: 'SN-10',
            humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            humidityPercentage: 50,
            humidity_created_at: '2026-07-06T11:00:00Z',
            batteryPercent: null,
            battery_created_at: null,
          }],
        },
        {
          id: 2,
          name: 'Aloe',
          imageUrl: null,
          createdAt: '2026-01-01',
          devices: [{
            id: 20,
            serialNumber: 'SN-20',
            humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            humidityPercentage: 50,
            humidity_created_at: '2026-07-06T11:00:00Z',
            batteryPercent: null,
            battery_created_at: null,
          }],
        },
      ]);

      const plants = await fetchPlants();
      expect(plants.map((p) => p.name)).toEqual(['Aloe', 'Zinnia']);
    });

    it('throws when get_user_plants RPC fails', async () => {
      mockAuthenticatedUser();
      mockRpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

      await expect(fetchPlants()).rejects.toThrow('RPC failed');
    });

    it('treats null RPC payload as an empty plant list', async () => {
      mockAuthenticatedUser();
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(fetchPlants()).resolves.toEqual([]);
    });

    it('marks online plants that need water', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'Thirsty',
        imageUrl: null,
        createdAt: '2026-01-01',
        is_outdoor: true,
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 40, sleepDurationSeconds: 3600 }],
          humidityPercentage: 20,
          humidity_created_at: '2026-07-06T11:00:00Z',
          batteryPercent: 80,
          battery_created_at: '2026-07-06T11:00:00Z',
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0]).toMatchObject({
        is_outdoor: true,
        statuses: ['WATERING_NEEDED'],
        batteryPercent: 80,
      });
    });

    it('marks offline plants that still have enough moisture', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'Gone',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidityPercentage: 50,
          humidity_created_at: '2026-07-05T08:00:00Z',
          batteryPercent: null,
          battery_created_at: null,
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0].statuses).toEqual(['OFFLINE']);
    });

    it('treats devices with missing measurement timestamps as offline', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'Sparse',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidityPercentage: 40,
          humidity_created_at: null,
          batteryPercent: 5,
          battery_created_at: null,
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0]).toMatchObject({
        statuses: ['OFFLINE'],
        humidityPercent: null,
        batteryPercent: null,
        lastMeasuredAt: null,
      });
    });

    it('ignores devices without humidity sensor config', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 1,
        name: 'No config',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [],
          humidityPercentage: 40,
          humidity_created_at: '2026-07-06T11:00:00Z',
          batteryPercent: 90,
          battery_created_at: '2026-07-06T11:00:00Z',
        }],
      }]);

      const plants = await fetchPlants();
      expect(plants[0]).toMatchObject({
        statuses: ['OFFLINE'],
        deviceId: null,
        serialNumber: null,
      });
    });
  });

  describe('createPlant', () => {
    it('inserts a plant for the authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });
      await expect(createPlant('New Plant', null)).resolves.toBeUndefined();
    });

    it('inserts a plant with species id when provided', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });

      await expect(createPlant('New Plant', null, 7)).resolves.toBeUndefined();
    });

    it('inserts an outdoor plant when requested', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });

      await expect(createPlant('Patio', null, null, true)).resolves.toBeUndefined();
    });

    it('throws when insert fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: new Error('Insert failed') } });

      await expect(createPlant('New Plant', null)).rejects.toThrow('Insert failed');
    });
  });

  describe('updatePlant', () => {
    it('updates plant for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });
      await expect(updatePlant(1, 'Renamed', 'http://img')).resolves.toBeUndefined();
    });

    it('updates plant species id when provided', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });

      await expect(updatePlant(1, 'Renamed', 'http://img', 7)).resolves.toBeUndefined();
    });

    it('updates outdoor flag when provided', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });

      await expect(updatePlant(1, 'Patio', null, null, true)).resolves.toBeUndefined();
    });

    it('throws when update fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: new Error('Update failed') } });

      await expect(updatePlant(1, 'Renamed', null)).rejects.toThrow('Update failed');
    });
  });

  describe('deletePlant', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(deletePlant(1)).rejects.toThrow('Not authenticated');
    });

    it('deletes plant for authenticated user', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: null } });
      await expect(deletePlant(1)).resolves.toBeUndefined();
    });

    it('throws when delete fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({ plants: { data: null, error: new Error('Delete failed') } });

      await expect(deletePlant(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('fetchPlantStatusesByIds', () => {
    it('returns empty map for empty input', async () => {
      await expect(fetchPlantStatusesByIds([])).resolves.toEqual(new Map());
    });

    it('returns statuses with device measurements for requested plants', async () => {
      mockAuthenticatedUser();
      mockUserPlants([{
        id: 3,
        name: 'Fern',
        imageUrl: null,
        createdAt: '2026-01-01',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidityPercentage: 42,
          humidity_created_at: '2026-07-06T11:00:00Z',
          batteryPercent: 90,
          battery_created_at: '2026-07-06T11:00:00Z',
        }],
      }]);

      const statuses = await fetchPlantStatusesByIds([3]);
      expect(statuses.get(3)).toEqual(['HEALTHY']);
      expect(mockRpc).toHaveBeenCalledWith('get_user_plants', {
        p_plant_ids: [3],
      });
    });

    it('deduplicates plant ids before calling the RPC', async () => {
      mockAuthenticatedUser();
      mockUserPlants([]);

      await fetchPlantStatusesByIds([3, 3, 5]);
      expect(mockRpc).toHaveBeenCalledWith('get_user_plants', {
        p_plant_ids: [3, 5],
      });
    });
  });

  describe('fetchPlantHistory', () => {
    it('returns empty history when plant has no devices', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [] }, error: null },
      });

      await expect(fetchPlantHistory(1, '7d')).resolves.toEqual({
        humidity: [],
        battery: [],
      });
    });

    it('returns measurement history for plant devices', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [{ id: 10 }] }, error: null },
        humidity_measurements: {
          data: [{ humidityPercentage: 42, createdAt: '2026-07-06T10:00:00Z' }],
          error: null,
        },
        battery_measurements: {
          data: [{ batteryPercent: 88, createdAt: '2026-07-06T10:00:00Z' }],
          error: null,
        },
      });

      await expect(fetchPlantHistory(1, '7d')).resolves.toEqual({
        humidity: [{ value: 42, createdAt: '2026-07-06T10:00:00Z' }],
        battery: [{ value: 88, createdAt: '2026-07-06T10:00:00Z' }],
      });
    });

    it('throws when the plant lookup fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: null, error: new Error('Plant missing') },
      });

      await expect(fetchPlantHistory(1, '7d')).rejects.toThrow('Plant missing');
    });

    it('throws when humidity history fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [{ id: 10 }] }, error: null },
        humidity_measurements: { data: null, error: new Error('Humidity failed') },
        battery_measurements: { data: [], error: null },
      });

      await expect(fetchPlantHistory(1, '14d')).rejects.toThrow('Humidity failed');
    });

    it('throws when battery history fails', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [{ id: 10 }] }, error: null },
        humidity_measurements: { data: [], error: null },
        battery_measurements: { data: null, error: new Error('Battery failed') },
      });

      await expect(fetchPlantHistory(1, '30d')).rejects.toThrow('Battery failed');
    });

    it('coalesces null measurement rows to empty history arrays', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [{ id: 10 }] }, error: null },
        humidity_measurements: { data: null, error: null },
        battery_measurements: { data: null, error: null },
      });

      await expect(fetchPlantHistory(1, '90d')).resolves.toEqual({
        humidity: [],
        battery: [],
      });
    });
  });

  describe('fetchLastWateredAt', () => {
    it('returns null when plant has no devices', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [] }, error: null },
      });

      await expect(fetchLastWateredAt(1)).resolves.toBeNull();
    });

    it('returns null when humidity never rises by the watering threshold', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [{ id: 10 }] }, error: null },
        humidity_measurements: {
          data: [
            { humidityPercentage: 20, createdAt: '2026-07-01T10:00:00Z' },
            { humidityPercentage: 35, createdAt: '2026-07-02T10:00:00Z' },
          ],
          error: null,
        },
        battery_measurements: { data: [], error: null },
      });

      await expect(fetchLastWateredAt(1)).resolves.toBeNull();
    });

    it('returns the timestamp of the most recent watering rise', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: { data: { devices: [{ id: 10 }] }, error: null },
        humidity_measurements: {
          data: [
            { humidityPercentage: 15, createdAt: '2026-06-01T10:00:00Z' },
            { humidityPercentage: 50, createdAt: '2026-06-01T18:00:00Z' },
            { humidityPercentage: 20, createdAt: '2026-07-04T10:00:00Z' },
            { humidityPercentage: 60, createdAt: '2026-07-04T18:00:00Z' },
          ],
          error: null,
        },
        battery_measurements: { data: [], error: null },
      });

      await expect(fetchLastWateredAt(1)).resolves.toBe('2026-07-04T18:00:00Z');
    });
  });

  describe('plant images', () => {
    it('uploads full and thumb variants and returns the full public URL', async () => {
      mockAuthenticatedUser();
      const upload = vi.fn().mockResolvedValue({ error: null });
      const getPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl:
            'https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg',
        },
      });
      mockStorageFrom.mockReturnValue({ upload, getPublicUrl });

      const file = new File(['x'], 'plant.png', { type: 'image/png' });
      await expect(uploadPlantImage(file)).resolves.toBe(
        'https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg',
      );
      expect(upload).toHaveBeenCalledTimes(2);
      expect(upload.mock.calls[0][0]).toMatch(/\.jpg$/);
      expect(upload.mock.calls[1][0]).toMatch(/_thumb\.jpg$/);
    });

    it('throws when image upload fails', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') }),
        getPublicUrl: vi.fn(),
        remove: vi.fn(),
      });

      const file = new File(['x'], 'plant.jpg', { type: 'image/jpeg' });
      await expect(uploadPlantImage(file)).rejects.toThrow('Upload failed');
    });

    it('rolls back the full object when thumb upload fails', async () => {
      mockAuthenticatedUser();
      const remove = vi.fn().mockResolvedValue({ error: null });
      const upload = vi
        .fn()
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: new Error('Thumb failed') });
      mockStorageFrom.mockReturnValue({ upload, getPublicUrl: vi.fn(), remove });

      const file = new File(['x'], 'plant.jpg', { type: 'image/jpeg' });
      await expect(uploadPlantImage(file)).rejects.toThrow('Thumb failed');
      expect(remove).toHaveBeenCalledWith([expect.stringMatching(/\.jpg$/)]);
    });

    it('skips delete for non-storage URLs', async () => {
      mockAuthenticatedUser();
      await expect(deletePlantImage('https://example.com/img.jpg')).resolves.toBeUndefined();
    });

    it('skips delete when there is no public URL', async () => {
      mockAuthenticatedUser();
      await expect(deletePlantImage(null)).resolves.toBeUndefined();
    });

    it('skips delete when the session user is missing', async () => {
      mockUnauthenticated();
      const url = 'https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg';
      await expect(deletePlantImage(url)).resolves.toBeUndefined();
    });

    it('deletes full and thumb objects when URL matches bucket', async () => {
      mockAuthenticatedUser();
      const remove = vi.fn().mockResolvedValue({ error: null });
      mockStorageFrom.mockReturnValue({ remove });

      const url = 'https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg';
      await expect(deletePlantImage(url)).resolves.toBeUndefined();
      expect(remove).toHaveBeenCalledWith(['user-1/abc.jpg', 'user-1/abc_thumb.jpg']);
    });
  });
});
