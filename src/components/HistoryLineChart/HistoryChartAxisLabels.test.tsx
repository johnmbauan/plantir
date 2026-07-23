import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryChartAxisLabels from './HistoryChartAxisLabels';
import { formatAxisDate } from './utils';
import type { PlotPoint } from './types';

const plotPoints: PlotPoint[] = [
  { x: 14, y: 50, value: 40, createdAt: '2026-07-01T12:00:00Z' },
  { x: 270, y: 40, value: 55, createdAt: '2026-07-15T12:00:00Z' },
  { x: 526, y: 30, value: 70, createdAt: '2026-07-30T12:00:00Z' },
];

describe('HistoryChartAxisLabels', () => {
  it('renders date labels with start, middle, and end anchors', () => {
    render(
      <svg>
        <HistoryChartAxisLabels plotPoints={plotPoints} indices={[0, 1, 2]} />
      </svg>,
    );

    const labels = screen.getAllByTestId('axis-label');
    expect(labels).toHaveLength(3);
    expect(labels[0]).toHaveTextContent(formatAxisDate(plotPoints[0].createdAt));
    expect(labels[0]).toHaveAttribute('text-anchor', 'start');
    expect(labels[1]).toHaveTextContent(formatAxisDate(plotPoints[1].createdAt));
    expect(labels[1]).toHaveAttribute('text-anchor', 'middle');
    expect(labels[2]).toHaveTextContent(formatAxisDate(plotPoints[2].createdAt));
    expect(labels[2]).toHaveAttribute('text-anchor', 'end');
  });
});
