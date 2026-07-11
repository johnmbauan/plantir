import { describe, it, expect } from 'vitest'
import {
  compareNullable,
  compareStrings,
  compareNumbers,
  compareDates,
} from './sort'

describe('compareNullable', () => {
  it('returns 0 when both values are null or undefined', () => {
    expect(compareNullable(null, null)).toBe(0)
    expect(compareNullable(undefined, undefined)).toBe(0)
    expect(compareNullable(null, undefined)).toBe(0)
  })

  it('sorts null values after defined values', () => {
    expect(compareNullable(null, 'a')).toBe(1)
    expect(compareNullable('a', null)).toBe(-1)
    expect(compareNullable(undefined, 5)).toBe(1)
    expect(compareNullable(5, undefined)).toBe(-1)
  })

  it('returns 0 when both values are defined', () => {
    expect(compareNullable('a', 'b')).toBe(0)
    expect(compareNullable(1, 2)).toBe(0)
  })
})

describe('compareStrings', () => {
  it('compares strings ascending', () => {
    expect(compareStrings('apple', 'banana', 'asc')).toBeLessThan(0)
    expect(compareStrings('banana', 'apple', 'asc')).toBeGreaterThan(0)
    expect(compareStrings('same', 'same', 'asc')).toBe(0)
  })

  it('compares strings descending', () => {
    expect(compareStrings('apple', 'banana', 'desc')).toBeGreaterThan(0)
    expect(compareStrings('banana', 'apple', 'desc')).toBeLessThan(0)
  })

  it('sorts null strings last regardless of direction', () => {
    expect(compareStrings(null, 'a', 'asc')).toBeGreaterThan(0)
    expect(compareStrings('a', null, 'asc')).toBeLessThan(0)
    expect(compareStrings(null, 'a', 'desc')).toBeGreaterThan(0)
    expect(compareStrings('a', null, 'desc')).toBeLessThan(0)
  })
})

describe('compareNumbers', () => {
  it('compares numbers ascending', () => {
    expect(compareNumbers(10, 20, 'asc')).toBeLessThan(0)
    expect(compareNumbers(20, 10, 'asc')).toBeGreaterThan(0)
    expect(compareNumbers(5, 5, 'asc')).toBe(0)
  })

  it('compares numbers descending', () => {
    expect(compareNumbers(10, 20, 'desc')).toBeGreaterThan(0)
    expect(compareNumbers(20, 10, 'desc')).toBeLessThan(0)
  })

  it('sorts null numbers last regardless of direction', () => {
    expect(compareNumbers(null, 10, 'asc')).toBeGreaterThan(0)
    expect(compareNumbers(10, null, 'asc')).toBeLessThan(0)
    expect(compareNumbers(null, 10, 'desc')).toBeGreaterThan(0)
    expect(compareNumbers(10, null, 'desc')).toBeLessThan(0)
  })
})

describe('compareDates', () => {
  it('compares ISO timestamps ascending', () => {
    expect(
      compareDates('2026-01-01T00:00:00Z', '2026-06-01T00:00:00Z', 'asc'),
    ).toBeLessThan(0)
    expect(
      compareDates('2026-06-01T00:00:00Z', '2026-01-01T00:00:00Z', 'asc'),
    ).toBeGreaterThan(0)
    expect(
      compareDates('2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 'asc'),
    ).toBe(0)
  })

  it('compares ISO timestamps descending', () => {
    expect(
      compareDates('2026-01-01T00:00:00Z', '2026-06-01T00:00:00Z', 'desc'),
    ).toBeGreaterThan(0)
    expect(
      compareDates('2026-06-01T00:00:00Z', '2026-01-01T00:00:00Z', 'desc'),
    ).toBeLessThan(0)
  })

  it('sorts null dates last regardless of direction', () => {
    expect(compareDates(null, '2026-01-01T00:00:00Z', 'asc')).toBeGreaterThan(0)
    expect(compareDates('2026-01-01T00:00:00Z', null, 'asc')).toBeLessThan(0)
    expect(compareDates(null, '2026-01-01T00:00:00Z', 'desc')).toBeGreaterThan(0)
    expect(compareDates('2026-01-01T00:00:00Z', null, 'desc')).toBeLessThan(0)
  })
})
