import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import HistoryChartHeader from './HistoryChartHeader';

describe('HistoryChartHeader', () => {
  it('shows the title and latest/min/max summary', () => {
    renderWithProviders(
      <HistoryChartHeader title="Humidity trend" latest={55} min={40} max={70} unit="%" />,
    );

    expect(screen.getByText('Humidity trend')).toBeInTheDocument();
    expect(screen.getByText('Latest 55% · Min 40% · Max 70%')).toBeInTheDocument();
  });
});
