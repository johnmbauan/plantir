import { describe, it, expect } from 'vitest';
import { DEFAULT_HUMIDITY_CONFIG } from './deviceDefaults';

describe('DEFAULT_HUMIDITY_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_HUMIDITY_CONFIG).toEqual({
      minHumidityThreshold: 15,
      airValue: 2400,
      waterValue: 850,
      sleepDurationSeconds: 28800,
    });
  });
});
