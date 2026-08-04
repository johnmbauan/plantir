import { describe, it, expect } from 'vitest';
import { findLastWateredAt, WATERING_HUMIDITY_INCREASE } from './watering';
import type { MeasurementPoint } from '@/types';

function point(value: number, createdAt: string): MeasurementPoint {
  return { value, createdAt };
}

describe('WATERING_HUMIDITY_INCREASE', () => {
  it('is 30 percentage points', () => {
    expect(WATERING_HUMIDITY_INCREASE).toBe(30);
  });
});

describe('findLastWateredAt', () => {
  it('returns null for an empty series', () => {
    expect(findLastWateredAt([])).toBeNull();
  });

  it('returns null for a single reading', () => {
    expect(findLastWateredAt([point(40, '2026-07-01T10:00:00Z')])).toBeNull();
  });

  it('returns null when humidity never rises by the threshold', () => {
    expect(
      findLastWateredAt([
        point(20, '2026-07-01T10:00:00Z'),
        point(35, '2026-07-01T18:00:00Z'),
        point(49, '2026-07-02T10:00:00Z'),
      ]),
    ).toBeNull();
  });

  it('returns null when humidity only decreases', () => {
    expect(
      findLastWateredAt([
        point(70, '2026-07-01T10:00:00Z'),
        point(50, '2026-07-02T10:00:00Z'),
        point(20, '2026-07-03T10:00:00Z'),
      ]),
    ).toBeNull();
  });

  it('detects a rise of exactly the threshold', () => {
    expect(
      findLastWateredAt([
        point(20, '2026-07-01T10:00:00Z'),
        point(50, '2026-07-01T18:00:00Z'),
      ]),
    ).toBe('2026-07-01T18:00:00Z');
  });

  it('detects a rise above the threshold', () => {
    expect(
      findLastWateredAt([
        point(15, '2026-07-01T10:00:00Z'),
        point(55, '2026-07-01T18:00:00Z'),
      ]),
    ).toBe('2026-07-01T18:00:00Z');
  });

  it('returns the most recent watering when several qualify', () => {
    expect(
      findLastWateredAt([
        point(10, '2026-07-01T10:00:00Z'),
        point(50, '2026-07-01T18:00:00Z'),
        point(25, '2026-07-05T10:00:00Z'),
        point(60, '2026-07-05T18:00:00Z'),
      ]),
    ).toBe('2026-07-05T18:00:00Z');
  });

  it('ignores rises below the threshold between watering events', () => {
    expect(
      findLastWateredAt([
        point(20, '2026-07-01T10:00:00Z'),
        point(55, '2026-07-01T18:00:00Z'),
        point(40, '2026-07-02T10:00:00Z'),
        point(55, '2026-07-02T18:00:00Z'),
      ]),
    ).toBe('2026-07-01T18:00:00Z');
  });
});
