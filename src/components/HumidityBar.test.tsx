import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import HumidityBar from '@/components/HumidityBar';

describe('HumidityBar', () => {
  it('shows threshold label when threshold is set', () => {
    renderWithProviders(
      <HumidityBar humidityPercent={45} threshold={30} barColor="var(--green-400)" />,
    );

    expect(screen.getByText('min 30%')).toBeInTheDocument();
  });

  it('does not show threshold label when threshold is null', () => {
    renderWithProviders(
      <HumidityBar humidityPercent={45} threshold={null} barColor="var(--green-400)" />,
    );

    expect(screen.queryByText('45%')).not.toBeInTheDocument();
  });
});
