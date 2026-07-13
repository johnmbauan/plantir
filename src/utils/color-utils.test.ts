import { describe, it, expect } from 'vitest';
import {
  batteryMantineColor,
  batteryCssColor,
  humidityMantineColor,
  humidityBarCssColor,
} from './color-utils';

describe('batteryMantineColor', () => {
  it.each([
    [null, 'dimmed'],
    [80, 'green'],
    [30, 'green'],
    [29, 'orange'],
    [15, 'orange'],
    [14, 'red'],
    [10, 'red'],
  ] as const)('returns %s for %s%% battery', (pct: number | null, expected: string) => {
    expect(batteryMantineColor(pct)).toBe(expected);
  });
});

describe('batteryCssColor', () => {
  it.each([
    [null, undefined],
    [80, undefined],
    [30, undefined],
    [20, 'var(--mantine-color-orange-6)'],
    [10, 'var(--mantine-color-red-6)'],
  ] as const)('returns %s for %s%% battery', (pct: number | null, expected: string | undefined) => {
    expect(batteryCssColor(pct)).toBe(expected);
  });
});

describe('humidityMantineColor', () => {
  it.each([
    [null, 'dimmed'],
    [60, 'green'],
    [50, 'green'],
    [30, 'yellow'],
    [10, 'red'],
  ] as const)('returns %s for %s%% humidity', (pct: number | null, expected: string) => {
    expect(humidityMantineColor(pct)).toBe(expected);
  });
});

describe('humidityBarCssColor', () => {
  it.each([
    [null, 30, 'var(--green-400)'],
    [40, null, 'var(--green-400)'],
    [29, 30, 'var(--mantine-color-red-6)'],
    [30, 30, 'var(--terracotta-500)'],
    [32, 30, 'var(--terracotta-500)'],
    [34, 30, 'var(--green-400)'],
    [55, 30, 'var(--green-400)'],
  ] as const)(
    'returns %s for %s%% humidity with %s%% threshold',
    (humidity: number | null, thresh: number | null, expected: string) => {
      expect(humidityBarCssColor(humidity, thresh)).toBe(expected);
    },
  );

  it('uses the provided fallback when humidity or threshold is missing', () => {
    expect(humidityBarCssColor(null, 30, '#9ca3af')).toBe('#9ca3af');
    expect(humidityBarCssColor(40, null, '#9ca3af')).toBe('#9ca3af');
  });
});
