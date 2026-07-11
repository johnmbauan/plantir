import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import HistoryLineChart from '@/components/HistoryLineChart';

describe('HistoryLineChart', () => {
  it('shows empty state when there are no points', () => {
    renderWithProviders(
      <HistoryLineChart title="Humidity" points={[]} color="green" unit="%" />,
    );

    expect(
      screen.getByText('Humidity: no measurements in this time range.'),
    ).toBeInTheDocument();
  });

  it('shows title and latest value when points exist', () => {
    renderWithProviders(
      <HistoryLineChart
        title="Humidity"
        points={[
          { createdAt: '2026-07-06T08:00:00Z', value: 40 },
          { createdAt: '2026-07-06T09:00:00Z', value: 55 },
        ]}
        color="green"
        unit="%"
      />,
    );

    expect(screen.getByText('Humidity')).toBeInTheDocument();
    expect(screen.getByText(/Latest 55%/)).toBeInTheDocument();
    expect(screen.getByText(/Min 40%/)).toBeInTheDocument();
    expect(screen.getByText(/Max 55%/)).toBeInTheDocument();
  });
});
