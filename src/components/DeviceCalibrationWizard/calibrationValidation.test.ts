import { describe, it, expect } from 'vitest';
import { isValidDryReading, isValidWetReading } from './calibrationValidation';

describe('isValidDryReading', () => {
  it('accepts values within ±150 of 2700', () => {
    expect(isValidDryReading(2700)).toBe(true);
    expect(isValidDryReading(2550)).toBe(true);
    expect(isValidDryReading(2850)).toBe(true);
  });

  it('rejects values outside ±150 of 2700', () => {
    expect(isValidDryReading(2549)).toBe(false);
    expect(isValidDryReading(2851)).toBe(false);
    expect(isValidDryReading(512)).toBe(false);
  });
});

describe('isValidWetReading', () => {
  it('accepts values within ±150 of 950', () => {
    expect(isValidWetReading(950)).toBe(true);
    expect(isValidWetReading(800)).toBe(true);
    expect(isValidWetReading(1100)).toBe(true);
    expect(isValidWetReading(1060)).toBe(true);
  });

  it('rejects values outside ±150 of 950', () => {
    expect(isValidWetReading(799)).toBe(false);
    expect(isValidWetReading(1101)).toBe(false);
    expect(isValidWetReading(320)).toBe(false);
  });
});
