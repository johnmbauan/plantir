import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/render';
import HistoryChartCanvas from './HistoryChartCanvas';
import { CHART_WIDTH, formatHoverDate, PADDING, toPlotPoints } from './utils';

const points = toPlotPoints(
  [
    { value: 40, createdAt: '2026-07-01T12:00:00Z' },
    { value: 55, createdAt: '2026-07-15T12:00:00Z' },
    { value: 70, createdAt: '2026-07-30T12:00:00Z' },
  ],
  40,
  30,
);

describe('HistoryChartCanvas', () => {
  it('renders the polyline and axis labels without a hover marker by default', () => {
    renderWithProviders(
      <HistoryChartCanvas
        plotPoints={points}
        color="var(--terracotta-500)"
        unit="%"
        hover={null}
        svgRef={null}
        onPointerMove={vi.fn()}
        onPointerLeave={vi.fn()}
      />,
    );

    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
    expect(screen.getAllByTestId('axis-label')).toHaveLength(3);
    expect(screen.queryByTestId('hover-marker')).not.toBeInTheDocument();
  });

  it('shows hover marker and tooltip when a hover point is provided', () => {
    const hover = points[1];
    renderWithProviders(
      <HistoryChartCanvas
        plotPoints={points}
        color="green"
        unit="%"
        hover={hover}
        svgRef={null}
        onPointerMove={vi.fn()}
        onPointerLeave={vi.fn()}
      />,
    );

    expect(screen.getByTestId('hover-marker')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText(formatHoverDate(hover.createdAt))).toBeInTheDocument();
  });

  it('forwards pointer events to the provided handlers', () => {
    const onPointerMove = vi.fn();
    const onPointerLeave = vi.fn();
    renderWithProviders(
      <HistoryChartCanvas
        plotPoints={points}
        color="green"
        unit="%"
        hover={null}
        svgRef={null}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />,
    );

    const svg = screen.getByTestId('chart-svg');
    fireEvent.pointerMove(svg, { clientX: PADDING.left });
    fireEvent.pointerLeave(svg);

    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
  });

  it('uses the full chart width for the baseline', () => {
    renderWithProviders(
      <HistoryChartCanvas
        plotPoints={points}
        color="green"
        unit="%"
        hover={null}
        svgRef={null}
        onPointerMove={vi.fn()}
        onPointerLeave={vi.fn()}
      />,
    );

    const baseline = screen.getByTestId('baseline');
    expect(baseline).toHaveAttribute('x1', String(PADDING.left));
    expect(baseline).toHaveAttribute('x2', String(CHART_WIDTH - PADDING.right));
  });
});
