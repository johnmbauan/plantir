import { describe, it, expect } from 'vitest';
import {
  compareNullableNumber,
  compareNullableString,
  compareString,
  nextSortState,
} from '@/utils/sort';

describe('compareNullableNumber', () => {
  it('keeps nulls last for both directions', () => {
    expect(compareNullableNumber(null, 10, 'asc')).toBe(1);
    expect(compareNullableNumber(10, null, 'asc')).toBe(-1);
    expect(compareNullableNumber(null, null, 'asc')).toBe(0);
    expect(compareNullableNumber(null, 10, 'desc')).toBe(1);
    expect(compareNullableNumber(10, null, 'desc')).toBe(-1);
  });

  it('compares numbers by direction', () => {
    expect(compareNullableNumber(2, 5, 'asc')).toBeLessThan(0);
    expect(compareNullableNumber(2, 5, 'desc')).toBeGreaterThan(0);
  });
});

describe('compareNullableString', () => {
  it('keeps empty values last for both directions', () => {
    expect(compareNullableString(null, 'a', 'asc')).toBe(1);
    expect(compareNullableString('a', null, 'asc')).toBe(-1);
    expect(compareNullableString('', '', 'asc')).toBe(0);
    expect(compareNullableString(null, 'a', 'desc')).toBe(1);
  });

  it('compares strings by direction', () => {
    expect(compareNullableString('a', 'b', 'asc')).toBeLessThan(0);
    expect(compareNullableString('a', 'b', 'desc')).toBeGreaterThan(0);
  });
});

describe('compareString', () => {
  it('compares by direction', () => {
    expect(compareString('Apple', 'Zebra', 'asc')).toBeLessThan(0);
    expect(compareString('Apple', 'Zebra', 'desc')).toBeGreaterThan(0);
  });
});

describe('nextSortState', () => {
  it('toggles direction when the same column is selected', () => {
    expect(nextSortState('name', 'asc', 'name')).toEqual({ sortKey: 'name', sortDir: 'desc' });
    expect(nextSortState('name', 'desc', 'name')).toEqual({ sortKey: 'name', sortDir: 'asc' });
  });

  it('starts ascending when a new column is selected', () => {
    expect(nextSortState('name', 'desc', 'moisture')).toEqual({
      sortKey: 'moisture',
      sortDir: 'asc',
    });
  });
});
