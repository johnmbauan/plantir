import { describe, it, expect } from 'vitest';
import {
  batteryMantineColor,
  batteryCssColor,
  humidityMantineColor,
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
  ] as const)('returns %s for %s%% battery', (pct, expected) => {
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
  ] as const)('returns %s for %s%% battery', (pct, expected) => {
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
  ] as const)('returns %s for %s%% humidity', (pct, expected) => {
    expect(humidityMantineColor(pct)).toBe(expected);
  });
});
