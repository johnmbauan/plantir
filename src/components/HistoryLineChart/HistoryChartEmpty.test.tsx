import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import HistoryChartEmpty from './HistoryChartEmpty';

describe('HistoryChartEmpty', () => {
  it('shows the empty-state message for the chart title', () => {
    renderWithProviders(<HistoryChartEmpty title="Battery" />);

    expect(
      screen.getByText('Battery: no measurements in this time range.'),
    ).toBeInTheDocument();
  });
});
