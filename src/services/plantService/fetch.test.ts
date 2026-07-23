import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  setupFromMocks,
} from '@/test/mocks/supabase';
import {
  fetchPlants,
  fetchPlantHistory,
  fetchPlantStatusesByIds,
  fetchSpeciesCareById,
} from './fetch';

describe('plantService/fetch', () => {
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

    it('loads and returns plants for the authenticated user', async () => {
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
              humidity_measurements: [{ humidityPercentage: 40, createdAt: '2026-07-06T11:00:00Z' }],
              battery_measurements: [{ batteryPercent: 90, createdAt: '2026-07-06T11:00:00Z' }],
            }],
          }],
          error: null,
        },
      });

      const plants = await fetchPlants();
      expect(plants).toHaveLength(1);
      expect(plants[0].name).toBe('B');
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
              humidity_measurements: [{ humidityPercentage: 42, createdAt: '2026-07-06T11:00:00Z' }],
              battery_measurements: [{ batteryPercent: 90, createdAt: '2026-07-06T11:00:00Z' }],
            }],
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

  describe('fetchSpeciesCareById', () => {
    it('returns null when the species does not exist', async () => {
      setupFromMocks({ plant_species: { data: null, error: null } });
      await expect(fetchSpeciesCareById(99)).resolves.toBeNull();
    });

    it('returns mapped species care fields', async () => {
      setupFromMocks({
        plant_species: {
          data: {
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
          error: null,
        },
      });

      await expect(fetchSpeciesCareById(7)).resolves.toMatchObject({
        id: 7,
        displayName: 'Fiddle leaf fig',
        sunlight: 'Bright indirect',
        watering: 'Keep slightly moist',
      });
    });
  });
});
