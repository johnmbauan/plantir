import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import WeatherWidget from '@/components/WeatherWidget';

const mockSelectCity = vi.fn();

vi.mock('@/context/WeatherCityContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/WeatherCityContext')>();
  return {
    ...actual,
    useWeatherCity: vi.fn(),
  };
});

const WeatherCitySearchMock = vi.fn(({
  onCitySelect,
  showLocationSetupHint,
}: {
  onCitySelect: (r: unknown) => void;
  showLocationSetupHint?: boolean;
}) => (
  <div>
    {showLocationSetupHint && (
      <span>Set your city so Plantir can include rain forecasts in watering alerts for outdoor plants.</span>
    )}
    <button type="button" onClick={() => onCitySelect({ id: 1, name: 'Milan', latitude: 45.46, longitude: 9.19, country: 'Italy', admin1: 'Lombardy' })}>
      Pick Milan
    </button>
  </div>
));

vi.mock('@/components/WeatherWidget/WeatherCitySearch', () => ({
  WeatherCitySearch: (props: { onCitySelect: (r: unknown) => void }) => WeatherCitySearchMock(props),
}));

import { useWeatherCity } from '@/context/WeatherCityContext';

describe('WeatherWidget', () => {
  beforeEach(() => {
    vi.mocked(useWeatherCity).mockReturnValue({
      city: null,
      locationSource: 'none',
      forecast: null,
      loading: false,
      error: null,
      selectCity: mockSelectCity,
    });
  });

  it('shows city search when no city is selected', () => {
    renderWithProviders(<WeatherWidget />);

    expect(screen.getByText('Weather forecast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick Milan' })).toBeInTheDocument();
  });

  it('shows forecast when a city is selected', () => {
    vi.mocked(useWeatherCity).mockReturnValue({
      city: { name: 'Rome, Italy', lat: 41.89, lng: 12.49 },
      locationSource: 'stored',
      forecast: [
        { date: '2026-07-06', maxTemp: 28, minTemp: 18, weatherCode: 0 },
      ],
      loading: false,
      error: null,
      selectCity: mockSelectCity,
    });

    renderWithProviders(<WeatherWidget />);

    expect(screen.getByText('Rome, Italy')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pick Milan' })).not.toBeInTheDocument();
  });

  it('toggles edit mode to show city search', async () => {
    const user = userEvent.setup();
    vi.mocked(useWeatherCity).mockReturnValue({
      city: { name: 'Rome, Italy', lat: 41.89, lng: 12.49 },
      locationSource: 'stored',
      forecast: [{ date: '2026-07-06', maxTemp: 28, minTemp: 18, weatherCode: 0 }],
      loading: false,
      error: null,
      selectCity: mockSelectCity,
    });

    renderWithProviders(<WeatherWidget />);

    await user.click(screen.getByRole('button', { name: 'Change city' }));
    expect(screen.getByRole('button', { name: 'Pick Milan' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel city change' }));
    expect(screen.queryByRole('button', { name: 'Pick Milan' })).not.toBeInTheDocument();
  });

  it('calls selectCity when a city is picked from search', async () => {
    const user = userEvent.setup();
    vi.mocked(useWeatherCity).mockReturnValue({
      city: null,
      locationSource: 'none',
      forecast: null,
      loading: false,
      error: null,
      selectCity: mockSelectCity,
    });

    renderWithProviders(<WeatherWidget />);

    await user.click(screen.getByRole('button', { name: 'Pick Milan' }));

    expect(mockSelectCity).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milan', country: 'Italy' }),
    );
  });

  it('shows the location setup hint during onboarding', () => {
    renderWithProviders(<WeatherWidget locationSetupPrompt />);

    expect(screen.getByText('Set your city so Plantir can include rain forecasts in watering alerts for outdoor plants.')).toBeInTheDocument();
  });

  it('calls onLocationSet when a city is picked during onboarding', async () => {
    const user = userEvent.setup();
    const onLocationSet = vi.fn();

    renderWithProviders(<WeatherWidget locationSetupPrompt onLocationSet={onLocationSet} />);
    await user.click(screen.getByRole('button', { name: 'Pick Milan' }));

    expect(onLocationSet).toHaveBeenCalledTimes(1);
  });
});
