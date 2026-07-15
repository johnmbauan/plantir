import { describe, it, expect } from 'vitest';
import { buildPlant } from '@/test/builders/plant';
import {
  buildPlantAssignmentOptions,
  hasAssignedPlantOptions,
  toPlantSelectData,
} from './plantOptions';

describe('buildPlantAssignmentOptions', () => {
  it('marks plants with a device as assigned', () => {
    const plants = [
      buildPlant({ id: 1, name: 'Monstera', deviceId: 10 }),
      buildPlant({ id: 2, name: 'Ficus', deviceId: null }),
    ];

    expect(buildPlantAssignmentOptions(plants)).toEqual([
      {
        value: '1',
        label: 'Monstera',
        recommendedThreshold: null,
        hasDevice: true,
      },
      {
        value: '2',
        label: 'Ficus',
        recommendedThreshold: null,
        hasDevice: false,
      },
    ]);
  });

  it('allows the plant currently assigned to the edited device', () => {
    const plants = [buildPlant({ id: 1, name: 'Monstera', deviceId: 10 })];

    expect(buildPlantAssignmentOptions(plants, 10)).toEqual([
      expect.objectContaining({ value: '1', hasDevice: false }),
    ]);
  });
});

describe('toPlantSelectData', () => {
  it('disables plants that already have a device', () => {
    expect(
      toPlantSelectData([
        { value: '1', label: 'Monstera', hasDevice: true },
        { value: '2', label: 'Ficus', hasDevice: false },
      ]),
    ).toEqual([
      { value: '1', label: 'Monstera', disabled: true },
      { value: '2', label: 'Ficus', disabled: false },
    ]);
  });
});

describe('hasAssignedPlantOptions', () => {
  it('returns true when any option is assigned', () => {
    expect(
      hasAssignedPlantOptions([
        { value: '1', label: 'Monstera', hasDevice: true },
        { value: '2', label: 'Ficus', hasDevice: false },
      ]),
    ).toBe(true);
  });

  it('returns false when no plants are assigned', () => {
    expect(
      hasAssignedPlantOptions([{ value: '2', label: 'Ficus', hasDevice: false }]),
    ).toBe(false);
  });
});
