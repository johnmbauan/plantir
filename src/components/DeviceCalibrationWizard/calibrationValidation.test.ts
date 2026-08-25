import { describe, it, expect } from 'vitest';
import { isValidDryReading, isValidWetReading } from './calibrationValidation';

describe('isValidDryReading', () => {
  it('accepts values within ±210 of 2700', () => {
    expect(isValidDryReading(2700)).toBe(true);
    expect(isValidDryReading(2490)).toBe(true);
    expect(isValidDryReading(2910)).toBe(true);
  });

  it('rejects values outside ±210 of 2700', () => {
    expect(isValidDryReading(2489)).toBe(false);
    expect(isValidDryReading(2911)).toBe(false);
    expect(isValidDryReading(512)).toBe(false);
  });
});

describe('isValidWetReading', () => {
  it('accepts values within ±210 of 950', () => {
    expect(isValidWetReading(950)).toBe(true);
    expect(isValidWetReading(740)).toBe(true);
    expect(isValidWetReading(1160)).toBe(true);
    expect(isValidWetReading(1060)).toBe(true);
  });

  it('rejects values outside ±210 of 950', () => {
    expect(isValidWetReading(739)).toBe(false);
    expect(isValidWetReading(1161)).toBe(false);
    expect(isValidWetReading(320)).toBe(false);
  });
});
