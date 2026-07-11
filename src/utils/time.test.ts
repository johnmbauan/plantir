import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  relativeTime,
  formatInterval,
  isIntervalPreset,
  intervalPresetSelectValue,
  INTERVAL_PRESET_SECONDS,
  INTERVAL_PRESET_OPTIONS,
} from './time';

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for null input', () => {
    expect(relativeTime(null)).toBeNull();
  });

  it.each([
    ['just now', 30_000],
    ['5m ago', 5 * 60_000],
    ['3h ago', 3 * 60 * 60_000],
    ['2d ago', 2 * 24 * 60 * 60_000],
  ])('returns %s for the right age', (expected, offsetMs) => {
    const iso = new Date(Date.now() - offsetMs).toISOString();
    expect(relativeTime(iso)).toBe(expected);
  });
});

describe('formatInterval', () => {
  it.each([
    [30, '30s'],
    [90, '1min 30s'],
    [120, '2min'],
    [3660, '1h 1min'],
    [7200, '2h'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatInterval(seconds)).toBe(expected);
  });
});

describe('interval presets', () => {
  it('includes all preset seconds in options', () => {
    for (const seconds of INTERVAL_PRESET_SECONDS) {
      expect(INTERVAL_PRESET_OPTIONS.some((o) => o.value === String(seconds))).toBe(true);
    }
    expect(INTERVAL_PRESET_OPTIONS[INTERVAL_PRESET_OPTIONS.length - 1]?.value).toBe('custom');
  });

  it('detects preset values', () => {
    expect(isIntervalPreset(3600)).toBe(true);
    expect(isIntervalPreset(9999)).toBe(false);
  });

  it('maps preset to select value', () => {
    expect(intervalPresetSelectValue(3600)).toBe('3600');
    expect(intervalPresetSelectValue(9999)).toBe('custom');
  });
});
