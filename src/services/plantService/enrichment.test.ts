import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildPlant } from '@/test/builders/plant';
import {
  applyBatteryMeasurement,
  applyHumidityMeasurement,
  enrichPlant,
  getCachedPlantStatuses,
  publishPlantStatuses,
  sortPlants,
  waitForCachedPlantStatuses,
  type RawPlant,
} from './enrichment';

function rawPlant(overrides: Partial<RawPlant> = {}): RawPlant {
  return {
    id: 1,
    name: 'Plant',
    imageUrl: null,
    createdAt: '2026-01-01',
    devices: [],
    ...overrides,
  };
}

describe('plantService/enrichment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
    publishPlantStatuses([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('enrichPlant', () => {
    it('maps humidity, battery, and HEALTHY status from the humidity device', () => {
      const plant = enrichPlant(rawPlant({
        name: 'B',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidity_measurements: [{ humidityPercentage: 40, createdAt: '2026-07-06T11:00:00Z' }],
          battery_measurements: [{ batteryPercent: 90, createdAt: '2026-07-06T11:00:00Z' }],
        }],
      }));

      expect(plant).toMatchObject({
        name: 'B',
        humidityPercent: 40,
        serialNumber: 'SN-10',
        statuses: ['HEALTHY'],
      });
    });

    it('maps serialNumber from the humidity device', () => {
      const plant = enrichPlant(rawPlant({
        name: 'Fern',
        devices: [{
          id: 10,
          serialNumber: 'SN-FERN',
          humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
          humidity_measurements: [{ humidityPercentage: 50, createdAt: '2026-07-06T11:00:00Z' }],
          battery_measurements: [],
        }],
      }));

      expect(plant.serialNumber).toBe('SN-FERN');
    });

    it('sets serialNumber to null when plant has no device', () => {
      const plant = enrichPlant(rawPlant({ name: 'No Device', devices: [] }));
      expect(plant.serialNumber).toBeNull();
    });

    it('maps species summary when available', () => {
      const plant = enrichPlant(rawPlant({
        name: 'Ficus',
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
      }));

      expect(plant).toMatchObject({
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

    it('marks plants needing water and offline', () => {
      const plant = enrichPlant(rawPlant({
        name: 'Dry',
        devices: [{
          id: 10,
          serialNumber: 'SN-10',
          humidity_sensors_config: [{ minHumidityThreshold: 30, sleepDurationSeconds: 3600 }],
          humidity_measurements: [{ humidityPercentage: 10, createdAt: '2026-07-05T08:00:00Z' }],
          battery_measurements: [{ batteryPercent: 5, createdAt: '2026-07-05T08:00:00Z' }],
        }],
      }));

      expect(plant.statuses).toEqual(
        expect.arrayContaining(['OFFLINE', 'WATERING_NEEDED', 'RECHARGE_NEEDED']),
      );
    });

    it('returns offline plant without humidity device', () => {
      const plant = enrichPlant(rawPlant({ name: 'No device', devices: [] }));
      expect(plant.statuses).toEqual(['OFFLINE']);
    });
  });

  describe('sortPlants', () => {
    it('sorts plants with null humidity after those with readings', () => {
      const plants = sortPlants([
        enrichPlant(rawPlant({
          id: 1,
          name: 'Alpha',
          devices: [{
            id: 10,
            serialNumber: 'SN-10',
            humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            humidity_measurements: [{ humidityPercentage: 30, createdAt: '2026-07-06T11:00:00Z' }],
            battery_measurements: [],
          }],
        })),
        enrichPlant(rawPlant({
          id: 2,
          name: 'Beta',
          devices: [{
            id: 20,
            serialNumber: 'SN-20',
            humidity_sensors_config: [{ minHumidityThreshold: 15, sleepDurationSeconds: 3600 }],
            humidity_measurements: [{ humidityPercentage: 60, createdAt: '2026-07-06T11:00:00Z' }],
            battery_measurements: [],
          }],
        })),
        enrichPlant(rawPlant({ id: 3, name: 'Gamma', devices: [] })),
      ]);

      expect(plants.map((p) => p.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
    });

    it('sorts two null-humidity plants alphabetically', () => {
      const plants = sortPlants([
        enrichPlant(rawPlant({ id: 1, name: 'Zebra', devices: [] })),
        enrichPlant(rawPlant({ id: 2, name: 'Apple', devices: [] })),
      ]);

      expect(plants.map((p) => p.name)).toEqual(['Apple', 'Zebra']);
    });
  });

  describe('applyHumidityMeasurement', () => {
    it('updates humidity and recomputes statuses for the matching device', () => {
      const next = applyHumidityMeasurement(
        [buildPlant({
          deviceId: 10,
          humidityPercent: 40,
          threshold: 15,
          sleepDurationSeconds: 3600,
          batteryPercent: 90,
          statuses: ['HEALTHY'],
        })],
        { deviceId: 10, humidityPercentage: 10, createdAt: '2026-07-06T11:50:00Z' },
      );

      expect(next[0]).toMatchObject({
        humidityPercent: 10,
        lastMeasuredAt: '2026-07-06T11:50:00Z',
        statuses: ['WATERING_NEEDED'],
      });
    });

    it('leaves unrelated plants unchanged', () => {
      const plants = [buildPlant({ deviceId: 10, humidityPercent: 40 })];
      const next = applyHumidityMeasurement(plants, {
        deviceId: 99,
        humidityPercentage: 5,
        createdAt: '2026-07-06T11:50:00Z',
      });
      expect(next).toBe(plants);
    });
  });

  describe('applyBatteryMeasurement', () => {
    it('flags recharge needed below the battery threshold', () => {
      const next = applyBatteryMeasurement(
        [buildPlant({ deviceId: 10, batteryPercent: 80, statuses: ['HEALTHY'] })],
        { deviceId: 10, batteryPercent: 5, createdAt: '2026-07-06T11:50:00Z' },
      );

      expect(next[0].batteryPercent).toBe(5);
      expect(next[0].statuses).toEqual(expect.arrayContaining(['HEALTHY', 'RECHARGE_NEEDED']));
    });

    it('clears recharge needed when battery recovers', () => {
      const next = applyBatteryMeasurement(
        [buildPlant({
          deviceId: 10,
          batteryPercent: 5,
          statuses: ['HEALTHY', 'RECHARGE_NEEDED'],
        })],
        { deviceId: 10, batteryPercent: 50, createdAt: '2026-07-06T11:50:00Z' },
      );

      expect(next[0].batteryPercent).toBe(50);
      expect(next[0].statuses).toEqual(['HEALTHY']);
    });
  });

  describe('status cache', () => {
    it('returns cached statuses when every requested id is present', () => {
      publishPlantStatuses([
        buildPlant({ id: 1, statuses: ['HEALTHY'] }),
        buildPlant({ id: 2, statuses: ['WATERING_NEEDED'] }),
      ]);

      expect(getCachedPlantStatuses([1, 2])).toEqual(
        new Map([
          [1, ['HEALTHY']],
          [2, ['WATERING_NEEDED']],
        ]),
      );
    });

    it('returns null when any requested id is missing', () => {
      publishPlantStatuses([buildPlant({ id: 1, statuses: ['HEALTHY'] })]);
      expect(getCachedPlantStatuses([1, 2])).toBeNull();
    });

    it('resolves waiters when statuses are published', async () => {
      const pending = waitForCachedPlantStatuses([1], 1000);
      publishPlantStatuses([buildPlant({ id: 1, statuses: ['OFFLINE'] })]);
      await expect(pending).resolves.toEqual(new Map([[1, ['OFFLINE']]]));
    });

    it('times out when statuses are never published', async () => {
      const pending = waitForCachedPlantStatuses([1], 100);
      await vi.advanceTimersByTimeAsync(100);
      await expect(pending).resolves.toBeNull();
    });
  });
});
