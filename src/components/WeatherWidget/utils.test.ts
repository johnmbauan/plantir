import { describe, it, expect } from 'vitest';
import { getWeatherInfo, formatDayLabel, formatShortDate } from './utils';

describe('getWeatherInfo', () => {
  it.each([
    [0, 'Clear'],
    [2, 'Partly cloudy'],
    [3, 'Overcast'],
    [45, 'Foggy'],
    [55, 'Drizzle'],
    [65, 'Rain'],
    [75, 'Snow'],
    [80, 'Showers'],
    [95, 'Storm'],
    [200, 'Unknown'],
  ])('maps weather code %i to %s', (code, label) => {
    expect(getWeatherInfo(code).label).toBe(label);
  });
});

describe('formatDayLabel', () => {
  it('returns Today and Tomorrow for first two indices', () => {
    expect(formatDayLabel('2026-07-06', 0)).toBe('Today');
    expect(formatDayLabel('2026-07-07', 1)).toBe('Tomorrow');
  });

  it('returns weekday for later indices', () => {
    expect(formatDayLabel('2026-07-08', 2)).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
  });
});

describe('formatShortDate', () => {
  it('formats a date as month and day', () => {
    expect(formatShortDate('2026-07-06')).toBe('Jul 6');
  });
});
