import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useHistoryChartHover } from './useHistoryChartHover';
import type { PlotPoint } from './types';
import { CHART_WIDTH, PADDING } from './utils';

const plotPoints: PlotPoint[] = [
  { x: PADDING.left, y: 50, value: 40, createdAt: '2026-07-01T12:00:00Z' },
  { x: CHART_WIDTH / 2, y: 40, value: 55, createdAt: '2026-07-15T12:00:00Z' },
  { x: CHART_WIDTH - PADDING.right, y: 30, value: 70, createdAt: '2026-07-30T12:00:00Z' },
];

function attachSvg(svgRef: { current: SVGSVGElement | null }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: CHART_WIDTH,
    height: 150,
    right: CHART_WIDTH,
    bottom: 150,
    toJSON: () => ({}),
  });
  svgRef.current = svg;
  return svg;
}

describe('useHistoryChartHover', () => {
  it('starts with no hover point', () => {
    const { result } = renderHook(() => useHistoryChartHover(plotPoints));
    expect(result.current.hover).toBeNull();
  });

  it('selects the nearest point on pointer move and clears on leave', () => {
    const { result } = renderHook(() => useHistoryChartHover(plotPoints));
    attachSvg(result.current.svgRef);

    act(() => {
      result.current.handlePointerMove({
        clientX: CHART_WIDTH - PADDING.right,
      } as ReactPointerEvent<SVGSVGElement>);
    });

    expect(result.current.hover).toEqual(plotPoints[2]);

    act(() => {
      result.current.handlePointerLeave();
    });

    expect(result.current.hover).toBeNull();
  });

  it('uses chart x 0 when the svg ref is not attached', () => {
    const { result } = renderHook(() => useHistoryChartHover(plotPoints));

    act(() => {
      result.current.handlePointerMove({
        clientX: 999,
      } as ReactPointerEvent<SVGSVGElement>);
    });

    expect(result.current.hover).toEqual(plotPoints[0]);
  });
});
