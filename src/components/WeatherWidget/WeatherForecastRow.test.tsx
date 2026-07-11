import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { WeatherForecastRow } from '@/components/WeatherWidget/WeatherForecastRow';

describe('WeatherForecastRow', () => {
  it('shows error message when forecast fails', () => {
    renderWithProviders(
      <WeatherForecastRow forecast={null} loading={false} error="Could not load forecast." />,
    );

    expect(screen.getByText('Could not load forecast.')).toBeInTheDocument();
  });

  it('renders forecast day slots', () => {
    renderWithProviders(
      <WeatherForecastRow
        forecast={[
          { date: '2026-07-06', maxTemp: 28, minTemp: 18, weatherCode: 0 },
          { date: '2026-07-07', maxTemp: 30, minTemp: 19, weatherCode: 2 },
        ]}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('shows loading skeletons while forecast loads', () => {
    renderWithProviders(
      <WeatherForecastRow forecast={null} loading error={null} />,
    );

    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.queryByText('Could not load forecast.')).not.toBeInTheDocument();
  });

  it('returns null when forecast is absent and not loading', () => {
    renderWithProviders(
      <WeatherForecastRow forecast={null} loading={false} error={null} />,
    );

    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.queryByText('Could not load forecast.')).not.toBeInTheDocument();
  });
});
