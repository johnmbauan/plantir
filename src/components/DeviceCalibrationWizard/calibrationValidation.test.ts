import { describe, it, expect } from 'vitest';
import { isValidDryReading, isValidWetReading } from './calibrationValidation';

describe('isValidDryReading', () => {
  it('accepts values within ±230 of 2650', () => {
    expect(isValidDryReading(2650)).toBe(true);
    expect(isValidDryReading(2490)).toBe(true);
    expect(isValidDryReading(2880)).toBe(true);
  });

  it('rejects values outside ±230 of 2650', () => {
    expect(isValidDryReading(2419)).toBe(false);
    expect(isValidDryReading(2881)).toBe(false);
    expect(isValidDryReading(512)).toBe(false);
  });
});

describe('isValidWetReading', () => {
  it('accepts values within ±230 of 950', () => {
    expect(isValidWetReading(950)).toBe(true);
    expect(isValidWetReading(740)).toBe(true);
    expect(isValidWetReading(1160)).toBe(true);
    expect(isValidWetReading(1060)).toBe(true);
  });

  it('rejects values outside ±230 of 950', () => {
    expect(isValidWetReading(719)).toBe(false);
    expect(isValidWetReading(1181)).toBe(false);
    expect(isValidWetReading(320)).toBe(false);
  });
});
