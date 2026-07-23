import { describe, it, expect } from 'vitest';
import { buildPlant } from '@/test/builders/plant';
import type { PlantSpeciesSummary } from '@/types';
import {
  plantMatchesSearch,
  sortPlantsByColumn,
} from '@/components/PlantsTab/utils';

function buildSpecies(overrides: Partial<PlantSpeciesSummary> = {}): PlantSpeciesSummary {
  return {
    id: 10,
    source: 'perenual',
    sourceSpeciesId: '42',
    scientificName: 'Monstera deliciosa',
    displayName: 'Swiss cheese plant',
    imageUrl: 'https://cdn/species.jpg',
    minSoilMoisture: null,
    maxSoilMoisture: null,
    minTemperatureCelsius: null,
    maxTemperatureCelsius: null,
    ...overrides,
  };
}

describe('plantMatchesSearch', () => {
  it('matches empty search against any plant', () => {
    expect(plantMatchesSearch(buildPlant(), '')).toBe(true);
    expect(plantMatchesSearch(buildPlant(), '   ')).toBe(true);
  });

  it('matches plant name case-insensitively', () => {
    expect(plantMatchesSearch(buildPlant({ name: 'Fern' }), 'fer')).toBe(true);
    expect(plantMatchesSearch(buildPlant({ name: 'Fern' }), 'zzz')).toBe(false);
  });

  it('matches species display name and scientific name', () => {
    const plant = buildPlant({
      name: 'Leafy',
      species: buildSpecies({ displayName: 'Pothos', scientificName: 'Epipremnum aureum' }),
    });

    expect(plantMatchesSearch(plant, 'poth')).toBe(true);
    expect(plantMatchesSearch(plant, 'epipremnum')).toBe(true);
  });

  it('matches device serial number', () => {
    expect(plantMatchesSearch(buildPlant({ serialNumber: 'SN-ABC' }), 'abc')).toBe(true);
  });

  it('handles missing species and serial', () => {
    const plant = buildPlant({ species: null, serialNumber: null });
    expect(plantMatchesSearch(plant, 'monstera')).toBe(true);
    expect(plantMatchesSearch(plant, 'sn')).toBe(false);
  });
});

describe('sortPlantsByColumn', () => {
  it('sorts by name ascending and descending', () => {
    const plants = [
      buildPlant({ id: 2, name: 'Zebra' }),
      buildPlant({ id: 1, name: 'Apple' }),
    ];

    expect(sortPlantsByColumn(plants, 'name', 'asc').map((p) => p.name)).toEqual(['Apple', 'Zebra']);
    expect(sortPlantsByColumn(plants, 'name', 'desc').map((p) => p.name)).toEqual(['Zebra', 'Apple']);
  });

  it('sorts by status urgency ascending', () => {
    const plants = [
      buildPlant({ id: 1, name: 'Healthy', statuses: ['HEALTHY'] }),
      buildPlant({ id: 2, name: 'Offline', statuses: ['OFFLINE'] }),
      buildPlant({ id: 3, name: 'Thirsty', statuses: ['WATERING_NEEDED'] }),
    ];

    expect(sortPlantsByColumn(plants, 'status', 'asc').map((p) => p.name)).toEqual([
      'Offline',
      'Thirsty',
      'Healthy',
    ]);
    expect(sortPlantsByColumn(plants, 'status', 'desc').map((p) => p.name)).toEqual([
      'Healthy',
      'Thirsty',
      'Offline',
    ]);
  });

  it('uses the most urgent status when a plant has multiple', () => {
    const plants = [
      buildPlant({ id: 1, name: 'A', statuses: ['HEALTHY', 'OFFLINE'] }),
      buildPlant({ id: 2, name: 'B', statuses: ['WATERING_NEEDED'] }),
    ];

    expect(sortPlantsByColumn(plants, 'status', 'asc').map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('treats empty statuses as healthy for ranking', () => {
    const plants = [
      buildPlant({ id: 1, name: 'Empty', statuses: [] }),
      buildPlant({ id: 2, name: 'Offline', statuses: ['OFFLINE'] }),
    ];

    expect(sortPlantsByColumn(plants, 'status', 'asc').map((p) => p.name)).toEqual([
      'Offline',
      'Empty',
    ]);
  });

  it('sorts by moisture and keeps nulls last', () => {
    const plants = [
      buildPlant({ id: 1, name: 'High', humidityPercent: 80 }),
      buildPlant({ id: 2, name: 'Low', humidityPercent: 20 }),
      buildPlant({ id: 3, name: 'None', humidityPercent: null }),
      buildPlant({ id: 4, name: 'AlsoNone', humidityPercent: null }),
    ];

    expect(sortPlantsByColumn(plants, 'moisture', 'asc').map((p) => p.name)).toEqual([
      'Low',
      'High',
      'AlsoNone',
      'None',
    ]);
    expect(sortPlantsByColumn(plants, 'moisture', 'desc').map((p) => p.name)).toEqual([
      'High',
      'Low',
      'AlsoNone',
      'None',
    ]);
  });

  it('sorts by device serial and keeps unassigned last', () => {
    const plants = [
      buildPlant({ id: 1, name: 'B', serialNumber: 'SN-B' }),
      buildPlant({ id: 2, name: 'A', serialNumber: 'SN-A' }),
      buildPlant({ id: 3, name: 'None', serialNumber: null }),
      buildPlant({ id: 4, name: 'AlsoNone', serialNumber: null }),
    ];

    expect(sortPlantsByColumn(plants, 'device', 'asc').map((p) => p.name)).toEqual([
      'A',
      'B',
      'AlsoNone',
      'None',
    ]);
    expect(sortPlantsByColumn(plants, 'device', 'desc').map((p) => p.name)).toEqual([
      'B',
      'A',
      'AlsoNone',
      'None',
    ]);
  });

  it('falls back to name when primary sort values are equal', () => {
    const plants = [
      buildPlant({ id: 2, name: 'Beta', humidityPercent: 40 }),
      buildPlant({ id: 1, name: 'Alpha', humidityPercent: 40 }),
    ];

    expect(sortPlantsByColumn(plants, 'moisture', 'asc').map((p) => p.name)).toEqual([
      'Alpha',
      'Beta',
    ]);
  });
});
