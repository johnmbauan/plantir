import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
  mockStorageFrom,
} from '@/test/mocks/supabase';
import {
  fetchPlants,
  createPlant,
  updatePlant,
  deletePlant,
  fetchPlantHistory,
  fetchPlantStatusesByIds,
  uploadPlantImage,
  deletePlantImage,
} from './plantService';

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
      setupFromMocks({
        plants: {
          data: [{
            id: 1,
            name: 'B',
            imageUrl: null,
            createdAt: '2026-01-01',
            devices: [{
              id: 10,
              serialNumber: 'SN-10',
              humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            }],
          }],
          error: null,
        },
        devices: {
          data: [{
            id: 10,
            humidity_measurements: [{ humidityPercentage: 40, createdAt: '2026-07-06T11:00:00Z' }],
            battery_measurements: [{ batteryPercent: 90, createdAt: '2026-07-06T11:00:00Z' }],
          }],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants[0]).toMatchObject({
        name: 'B',
        humidityPercent: 40,
        statuses: ['HEALTHY'],
      });
    });

    it('maps serialNumber from the humidity device', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [{
            id: 1,
            name: 'Fern',
            imageUrl: null,
            createdAt: '2026-01-01',
            devices: [{
              id: 10,
              serialNumber: 'SN-FERN',
              humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            }],
          }],
          error: null,
        },
        devices: {
          data: [{
            id: 10,
            humidity_measurements: [{ humidityPercentage: 50, createdAt: '2026-07-06T11:00:00Z' }],
            battery_measurements: [],
          }],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants[0].serialNumber).toBe('SN-FERN');
    });

    it('sets serialNumber to null when plant has no device', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [{
            id: 1,
            name: 'No Device',
            imageUrl: null,
            createdAt: '2026-01-01',
            devices: [],
          }],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants[0].serialNumber).toBeNull();
    });

    it('maps species summary when available', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [{
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
          }],
          error: null,
        },
      });

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
      setupFromMocks({
        plants: {
          data: [{
            id: 1,
            name: 'Dry',
            imageUrl: null,
            createdAt: '2026-01-01',
            devices: [{
              id: 10,
              serialNumber: 'SN-10',
              humidity_sensors_config: [{ minHumidityThreshold: 30, sleepDurationSeconds: 3600 }],
            }],
          }],
          error: null,
        },
        devices: {
          data: [{
            id: 10,
            humidity_measurements: [{ humidityPercentage: 10, createdAt: '2026-07-05T08:00:00Z' }],
            battery_measurements: [{ batteryPercent: 5, createdAt: '2026-07-05T08:00:00Z' }],
          }],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants[0].statuses).toEqual(expect.arrayContaining(['OFFLINE', 'WATERING_NEEDED', 'RECHARGE_NEEDED']));
    });

    it('returns offline plant without humidity device', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [{
            id: 1,
            name: 'No device',
            imageUrl: null,
            createdAt: '2026-01-01',
            devices: [],
          }],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants[0].statuses).toEqual(['OFFLINE']);
    });

    it('sorts plants with null humidity after those with readings', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [
            {
              id: 1,
              name: 'Alpha',
              imageUrl: null,
              createdAt: '2026-01-01',
              devices: [{
                id: 10,
                serialNumber: 'SN-10',
                humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
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
              }],
            },
            {
              id: 3,
              name: 'Gamma',
              imageUrl: null,
              createdAt: '2026-01-01',
              devices: [],
            },
          ],
          error: null,
        },
        devices: {
          data: [
            {
              id: 10,
              humidity_measurements: [{ humidityPercentage: 30, createdAt: '2026-07-06T11:00:00Z' }],
              battery_measurements: [],
            },
            {
              id: 20,
              humidity_measurements: [{ humidityPercentage: 60, createdAt: '2026-07-06T11:00:00Z' }],
              battery_measurements: [],
            },
          ],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants.map((p) => p.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
    });

    it('sorts two null-humidity plants alphabetically', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [
            { id: 1, name: 'Zebra', imageUrl: null, createdAt: '2026-01-01', devices: [] },
            { id: 2, name: 'Apple', imageUrl: null, createdAt: '2026-01-01', devices: [] },
          ],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants.map((p) => p.name)).toEqual(['Apple', 'Zebra']);
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
  });

  describe('fetchPlantStatusesByIds', () => {
    it('returns empty map for empty input', async () => {
      await expect(fetchPlantStatusesByIds([])).resolves.toEqual(new Map());
    });

    it('returns statuses with device measurements for requested plants', async () => {
      mockAuthenticatedUser();
      setupFromMocks({
        plants: {
          data: [{
            id: 3,
            name: 'Fern',
            imageUrl: null,
            createdAt: '2026-01-01',
            devices: [{
              id: 10,
              serialNumber: 'SN-10',
              humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            }],
          }],
          error: null,
        },
        devices: {
          data: [{
            id: 10,
            humidity_measurements: [{ humidityPercentage: 42, createdAt: '2026-07-06T11:00:00Z' }],
            battery_measurements: [{ batteryPercent: 90, createdAt: '2026-07-06T11:00:00Z' }],
          }],
          error: null,
        },
      });

      const statuses = await fetchPlantStatusesByIds([3]);
      expect(statuses.get(3)).toEqual(['HEALTHY']);
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
  });

  describe('plant images', () => {
    it('uploads image and returns public URL', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/plant.jpg' } }),
      });

      const file = new File(['x'], 'plant.jpg', { type: 'image/jpeg' });
      await expect(uploadPlantImage(file)).resolves.toBe('https://cdn/plant.jpg');
    });

    it('skips delete for non-storage URLs', async () => {
      mockAuthenticatedUser();
      await expect(deletePlantImage('https://example.com/img.jpg')).resolves.toBeUndefined();
    });

    it('deletes image from storage when URL matches bucket', async () => {
      mockAuthenticatedUser();
      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      });

      const url = 'https://x.supabase.co/storage/v1/object/public/plant-images/user-1/abc.jpg';
      await expect(deletePlantImage(url)).resolves.toBeUndefined();
    });
  });
});
