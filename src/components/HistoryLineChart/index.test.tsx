import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/render';
import HistoryLineChart from '@/components/HistoryLineChart';
import { CHART_WIDTH, formatAxisDate, formatHoverDate, PADDING } from './utils';

const twoPoints = [
  { createdAt: '2026-07-01T12:00:00Z', value: 40 },
  { createdAt: '2026-07-30T12:00:00Z', value: 55 },
];

describe('HistoryLineChart', () => {
  it('shows empty state when there are no points', () => {
    renderWithProviders(
      <HistoryLineChart title="Humidity" points={[]} color="green" unit="%" />,
    );

    expect(
      screen.getByText('Humidity: no measurements in this time range.'),
    ).toBeInTheDocument();
  });

  it('shows title, summary stats, and x-axis dates when points exist', () => {
    renderWithProviders(
      <HistoryLineChart title="Humidity" points={twoPoints} color="green" unit="%" />,
    );

    expect(screen.getByText('Humidity')).toBeInTheDocument();
    expect(screen.getByText('Latest 55% · Min 40% · Max 55%')).toBeInTheDocument();
    expect(screen.getByText(formatAxisDate(twoPoints[0].createdAt))).toBeInTheDocument();
    expect(screen.getByText(formatAxisDate(twoPoints[1].createdAt))).toBeInTheDocument();
  });

  it('renders a flat chart when all values are equal', () => {
    renderWithProviders(
      <HistoryLineChart
        title="Battery"
        points={[
          { createdAt: '2026-07-06T12:00:00Z', value: 80 },
          { createdAt: '2026-07-07T12:00:00Z', value: 80 },
        ]}
        color="green"
        unit="%"
      />,
    );

    expect(screen.getByText('Latest 80% · Min 80% · Max 80%')).toBeInTheDocument();
  });

  it('shows and clears the hover tooltip as the pointer moves across the chart', () => {
    renderWithProviders(
      <HistoryLineChart title="Humidity" points={twoPoints} color="green" unit="%" />,
    );

    const svg = screen.getByTestId('chart-svg');
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

    const hoverDate = formatHoverDate(twoPoints[1].createdAt);
    expect(screen.queryByText(hoverDate)).not.toBeInTheDocument();

    fireEvent.pointerMove(svg, { clientX: CHART_WIDTH - PADDING.right });
    expect(screen.getByText(hoverDate)).toBeInTheDocument();
    expect(screen.getByTestId('hover-marker')).toBeInTheDocument();

    fireEvent.pointerLeave(svg);
    expect(screen.queryByText(hoverDate)).not.toBeInTheDocument();
    expect(screen.queryByTestId('hover-marker')).not.toBeInTheDocument();
  });
});
