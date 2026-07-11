import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { WeatherCityHeader } from '@/components/WeatherWidget/WeatherCityHeader';

describe('WeatherCityHeader', () => {
  it('prompts user to select a city when location source is none', () => {
    renderWithProviders(
      <WeatherCityHeader
        city={null}
        locationSource="none"
        editMode={false}
        onToggleEdit={vi.fn()}
      />,
    );

    expect(screen.getByText('Select a city…')).toBeInTheDocument();
  });

  it('shows city name when location is set', () => {
    renderWithProviders(
      <WeatherCityHeader
        city={{ name: 'Rome, Lazio, Italy', lat: 41.89, lng: 12.49 }}
        locationSource="manual"
        editMode={false}
        onToggleEdit={vi.fn()}
      />,
    );

    expect(screen.getByText('Rome, Lazio, Italy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change city' })).toBeInTheDocument();
  });

  it('calls onToggleEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleEdit = vi.fn();

    renderWithProviders(
      <WeatherCityHeader
        city={{ name: 'Rome', lat: 41.89, lng: 12.49 }}
        locationSource="stored"
        editMode={false}
        onToggleEdit={onToggleEdit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Change city' }));
    expect(onToggleEdit).toHaveBeenCalledOnce();
  });
});
