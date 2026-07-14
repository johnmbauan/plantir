import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { WeatherCitySearch } from '@/components/WeatherWidget/WeatherCitySearch';

const mockSetSearchQuery = vi.fn();
const mockHandleSearch = vi.fn();

vi.mock('@/hooks/useCitySearch', () => ({
  useCitySearch: vi.fn(),
}));

import { useCitySearch } from '@/hooks/useCitySearch';

describe('WeatherCitySearch', () => {
  beforeEach(() => {
    vi.mocked(useCitySearch).mockReturnValue({
      searchQuery: '',
      setSearchQuery: mockSetSearchQuery,
      searchResults: [],
      searching: false,
      noResults: false,
      handleSearch: mockHandleSearch,
      resetSearch: vi.fn(),
    });
  });

  it('renders search input and button', () => {
    renderWithProviders(<WeatherCitySearch onCitySelect={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search for a city to see the forecast…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search city for weather forecast' })).toBeInTheDocument();
  });

  it('calls setSearchQuery when typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeatherCitySearch onCitySelect={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Search for a city to see the forecast…'), 'Rome');
    expect(mockSetSearchQuery).toHaveBeenCalled();
  });

  it('shows no-results message', () => {
    vi.mocked(useCitySearch).mockReturnValue({
      searchQuery: 'Nowhere',
      setSearchQuery: mockSetSearchQuery,
      searchResults: [],
      searching: false,
      noResults: true,
      handleSearch: mockHandleSearch,
      resetSearch: vi.fn(),
    });

    renderWithProviders(<WeatherCitySearch onCitySelect={vi.fn()} />);

    expect(screen.getByText('No cities found. Try a different name.')).toBeInTheDocument();
  });

  it('calls onCitySelect when a result is clicked', async () => {
    const user = userEvent.setup();
    const onCitySelect = vi.fn();

    vi.mocked(useCitySearch).mockReturnValue({
      searchQuery: 'Rome',
      setSearchQuery: mockSetSearchQuery,
      searchResults: [
        {
          id: 1,
          name: 'Rome',
          latitude: 41.89,
          longitude: 12.49,
          country: 'Italy',
          admin1: 'Lazio',
        },
      ],
      searching: false,
      noResults: false,
      handleSearch: mockHandleSearch,
      resetSearch: vi.fn(),
    });

    renderWithProviders(<WeatherCitySearch onCitySelect={onCitySelect} />);

    await user.click(screen.getByText('Rome'));
    expect(onCitySelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rome', country: 'Italy' }),
    );
  });

  it('calls handleSearch on Enter key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeatherCitySearch onCitySelect={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Search for a city to see the forecast…'), 'Rome{Enter}');

    expect(mockHandleSearch).toHaveBeenCalled();
  });

  it('shows intro hint when showIntroHint is true', () => {
    renderWithProviders(<WeatherCitySearch onCitySelect={vi.fn()} showIntroHint />);

    expect(screen.getByText('Choose a city to see the upcoming forecast.')).toBeInTheDocument();
  });

  it('calls handleSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WeatherCitySearch onCitySelect={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Search city for weather forecast' }));

    expect(mockHandleSearch).toHaveBeenCalled();
  });
});
