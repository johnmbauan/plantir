import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import {
  mockAuthenticatedUser,
  mockSession,
  resetSupabaseMocks,
  setupFromMocks,
} from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useWeatherCity, WEATHER_CITY_STORAGE_KEY } from '@/context/WeatherCityContext';
import { mockGeocodingResults } from '@/test/msw/handlers';

function WeatherCitySetter() {
  const { selectCity } = useWeatherCity();
  return (
    <button type="button" onClick={() => selectCity(mockGeocodingResults[0])}>
      Set weather city
    </button>
  );
}

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const emptyProgress = {
  plantsLoaded: true,
  hasPlants: false,
  hasDevices: false,
  oldestPlantCreatedAt: null as string | null,
};

const plantsAndDevicesProgress = {
  plantsLoaded: true,
  hasPlants: true,
  hasDevices: true,
  oldestPlantCreatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
};

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    localStorage.clear();
    mockNavigate.mockReset();
    mockSession(buildSession());
    mockAuthenticatedUser();
    setupFromMocks({
      notification_settings: { data: null, error: null },
    });
  });

  it('shows onboarding steps for a new user', async () => {
    renderWithProviders(<OnboardingChecklist {...emptyProgress} />);

    expect(await screen.findByText('Get started with Plantir')).toBeInTheDocument();
    expect(screen.getByText('Add your first plant')).toBeInTheDocument();
    expect(screen.getByText('Register your first device')).toBeInTheDocument();
    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
  });

  it('hides checklist when dismissed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist {...emptyProgress} />);

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByRole('button', { name: 'Dismiss onboarding' }));

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });

  it('does not render when previously dismissed', () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    renderWithProviders(<OnboardingChecklist {...emptyProgress} />);

    expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
  });

  it('marks completed steps when user has plants and devices', async () => {
    renderWithProviders(<OnboardingChecklist {...plantsAndDevicesProgress} />);

    expect(await screen.findByText(/2 of 4 steps complete/)).toBeInTheDocument();
    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
  });

  it('hides checklist when all steps are complete', async () => {
    localStorage.setItem('settings_visited', 'true');
    localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));

    renderWithProviders(
      <OnboardingChecklist
        plantsLoaded
        hasPlants
        hasDevices
        oldestPlantCreatedAt="2026-01-01"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });

  it('navigates to the dashboard when the location step is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist {...emptyProgress} />);

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByText('Set your location'));

    expect(mockNavigate).toHaveBeenCalledWith('/?setLocation=1');
  });

  it('marks location complete when weather city is stored', async () => {
    localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));

    renderWithProviders(<OnboardingChecklist {...plantsAndDevicesProgress} />);

    expect(await screen.findByText(/3 of 4 steps complete/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(1);
  });

  it('marks location complete when weather city is set after mount', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <OnboardingChecklist {...plantsAndDevicesProgress} />
        <WeatherCitySetter />
      </>,
    );

    expect(await screen.findByText(/2 of 4 steps complete/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Set weather city' }));

    expect(await screen.findByText(/3 of 4 steps complete/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(1);
  });

  it('navigates when an incomplete step is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist {...emptyProgress} />);

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByText('Add your first plant'));

    expect(mockNavigate).toHaveBeenCalledWith('/plants-center?tab=plants');
  });

  it('navigates when Go button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist {...emptyProgress} />);

    await screen.findByText('Get started with Plantir');
    const goButtons = screen.getAllByRole('button', { name: 'Go' });
    await user.click(goButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/plants-center?tab=plants');
  });

  it('marks notifications complete when plant is old enough', async () => {
    localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));
    const oldDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

    renderWithProviders(
      <OnboardingChecklist
        plantsLoaded
        hasPlants
        hasDevices
        oldestPlantCreatedAt={oldDate}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });

  it('does not render before plants have loaded', () => {
    renderWithProviders(
      <OnboardingChecklist
        plantsLoaded={false}
        hasPlants={false}
        hasDevices={false}
        oldestPlantCreatedAt={null}
      />,
    );

    expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
  });
});
