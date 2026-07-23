import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  axisLabelIndices,
  CHART_HEIGHT,
  CHART_WIDTH,
  clientXToChartX,
  formatAxisDate,
  formatHoverDate,
  formatValue,
  nearestIndex,
  PADDING,
  toPlotPoints,
} from './utils';
import type { PlotPoint } from './types';

describe('formatValue', () => {
  it('rounds and appends the unit', () => {
    expect(formatValue(40.4, '%')).toBe('40%');
    expect(formatValue(40.6, '%')).toBe('41%');
  });
});

describe('formatAxisDate', () => {
  it('formats an ISO timestamp as month and day', () => {
    const iso = '2026-07-06T12:00:00Z';
    expect(formatAxisDate(iso)).toBe(
      new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    );
  });
});

describe('formatHoverDate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('formats an ISO timestamp with month, day, and 24-hour time', () => {
    vi.stubEnv('TZ', 'UTC');
    expect(formatHoverDate('2026-07-06T12:00:00Z')).toBe('Jul 6, 12:00');
  });
});

describe('toPlotPoints', () => {
  it('maps a single point to the left padding and bottom of the plot area', () => {
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const [point] = toPlotPoints(
      [{ value: 50, createdAt: '2026-07-06T12:00:00Z' }],
      50,
      1,
    );

    expect(point).toEqual({
      x: PADDING.left,
      y: PADDING.top + plotHeight,
      value: 50,
      createdAt: '2026-07-06T12:00:00Z',
    });
  });

  it('maps min and max values across the full plot area', () => {
    const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const [first, last] = toPlotPoints(
      [
        { value: 10, createdAt: '2026-07-01T12:00:00Z' },
        { value: 90, createdAt: '2026-07-30T12:00:00Z' },
      ],
      10,
      80,
    );

    expect(first).toEqual({
      x: PADDING.left,
      y: PADDING.top + plotHeight,
      value: 10,
      createdAt: '2026-07-01T12:00:00Z',
    });
    expect(last).toEqual({
      x: PADDING.left + plotWidth,
      y: PADDING.top,
      value: 90,
      createdAt: '2026-07-30T12:00:00Z',
    });
  });
});

describe('axisLabelIndices', () => {
  it.each([
    [0, [0]],
    [1, [0]],
    [2, [0, 1]],
    [3, [0, 1, 2]],
    [5, [0, 2, 4]],
  ])('for length %i returns %j', (length, expected) => {
    expect(axisLabelIndices(length)).toEqual(expected);
  });
});

describe('nearestIndex', () => {
  const points: PlotPoint[] = [
    { x: 0, y: 0, value: 10, createdAt: 'a' },
    { x: 100, y: 0, value: 20, createdAt: 'b' },
    { x: 200, y: 0, value: 30, createdAt: 'c' },
  ];

  it('returns the closest point by x', () => {
    expect(nearestIndex(points, 10)).toBe(0);
    expect(nearestIndex(points, 140)).toBe(1);
    expect(nearestIndex(points, 190)).toBe(2);
  });
});

describe('clientXToChartX', () => {
  it('returns 0 when svg is null', () => {
    expect(clientXToChartX(100, null)).toBe(0);
  });

  it('maps client x into chart coordinates', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 100,
      top: 0,
      width: 540,
      height: 150,
      right: 640,
      bottom: 150,
      toJSON: () => ({}),
    });

    expect(clientXToChartX(370, svg)).toBe(270);
    expect(clientXToChartX(370, svg, 1000)).toBe(500);
  });
});
