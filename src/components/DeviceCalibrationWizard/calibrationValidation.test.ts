import { describe, it, expect } from 'vitest';
import { isValidDryReading, isValidWetReading } from './calibrationValidation';

describe('isValidDryReading', () => {
  it('accepts values within ±350 of 2650', () => {
    expect(isValidDryReading(2650)).toBe(true);
    expect(isValidDryReading(2300)).toBe(true);
    expect(isValidDryReading(3000)).toBe(true);
  });

  it('rejects values outside ±350 of 2650', () => {
    expect(isValidDryReading(2299)).toBe(false);
    expect(isValidDryReading(3001)).toBe(false);
    expect(isValidDryReading(512)).toBe(false);
  });
});

describe('isValidWetReading', () => {
  it('accepts values within ±350 of 950', () => {
    expect(isValidWetReading(950)).toBe(true);
    expect(isValidWetReading(600)).toBe(true);
    expect(isValidWetReading(1300)).toBe(true);
  });

  it('rejects values outside ±350 of 950', () => {
    expect(isValidWetReading(599)).toBe(false);
    expect(isValidWetReading(1301)).toBe(false);
    expect(isValidWetReading(320)).toBe(false);
  });
});
