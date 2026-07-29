import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildPlant } from '@/test/builders/plant';
import { buildSession } from '@/test/builders/session';
import { mockAuthenticatedUser, mockSession, resetSupabaseMocks } from '@/test/mocks/supabase';
import Dashboard from './Dashboard';

const fetchPlants = vi.fn();
const fetchActiveSnoozedPlants = vi.fn();
const unsnoozeNotification = vi.fn();
const weatherWidgetMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/plantService', () => ({
  fetchPlants: (...args: unknown[]) => fetchPlants(...args),
}));

vi.mock('@/services/notificationService', () => ({
  fetchActiveSnoozedPlants: (...args: unknown[]) => fetchActiveSnoozedPlants(...args),
  unsnoozeNotification: (...args: unknown[]) => unsnoozeNotification(...args),
}));

vi.mock('@/services/achievementService', () => ({
  recordDashboardVisit: vi.fn().mockResolvedValue([]),
  showUnlockToasts: vi.fn(),
}));

vi.mock('@/components/WeatherWidget', () => ({
  default: (props: { locationSetupPrompt?: boolean; onLocationSet?: () => void }) => {
    weatherWidgetMock(props);
    return (
      <div id="weather-widget">
        Weather widget
        {props.onLocationSet && (
          <button type="button" onClick={props.onLocationSet}>
            Confirm location
          </button>
        )}
      </div>
    );
  },
}));

vi.mock('@/components/OnboardingChecklist', () => ({
  default: () => null,
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

describe('Dashboard', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockAuthenticatedUser();
    mockSession(buildSession());
    vi.clearAllMocks();
    weatherWidgetMock.mockClear();
    localStorage.clear();
    fetchPlants.mockResolvedValue([
      buildPlant({ id: 1, name: 'Monstera', humidityPercent: 40 }),
      buildPlant({ id: 2, name: 'Ficus', humidityPercent: 70, statuses: ['WATERING_NEEDED'] }),
    ]);
    fetchActiveSnoozedPlants.mockResolvedValue(new Map());
    unsnoozeNotification.mockResolvedValue(undefined);
  });

  it('renders plants after loading', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
      expect(screen.getByText('Ficus')).toBeInTheDocument();
    });
  });

  it('renders species label in leaderboard when available', async () => {
    fetchPlants.mockResolvedValue([
      buildPlant({
        id: 1,
        name: 'Monstera',
        species: {
          id: 7,
          source: 'openplantbook',
          sourceSpeciesId: 'monstera_deliciosa',
          scientificName: 'Monstera deliciosa',
          displayName: 'Monstera deliciosa',
          imageUrl: null,
          minSoilMoisture: 35,
          maxSoilMoisture: 60,
          minTemperatureCelsius: 18,
          maxTemperatureCelsius: 30,
        },
      }),
    ]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    });
  });

  it('shows empty state when no plants exist', async () => {
    fetchPlants.mockResolvedValue([]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No plants yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add first plant' })).toBeInTheDocument();
    });
  });

  it('filters plants by search query', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search plants…'), 'Ficus');

    await waitFor(() => {
      expect(screen.queryByText('Monstera')).not.toBeInTheDocument();
      expect(screen.getByText('Ficus')).toBeInTheDocument();
    });
  });

  it('shows error notification when loading fails', async () => {
    const { notifications } = await import('@mantine/notifications');
    fetchPlants.mockRejectedValue(new Error('Network down'));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Network down' }),
      );
    });
  });

  it('filters plants by status badge toggle', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.click(screen.getByText(/1 need watering/));

    await waitFor(() => {
      expect(screen.queryByText('Monstera')).not.toBeInTheDocument();
      expect(screen.getByText('Ficus')).toBeInTheDocument();
    });

    await user.click(screen.getByText(/1 need watering/));

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });
  });

  it('sorts plants when sort option changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Name (A-Z)'));

    const rows = screen.getAllByText(/Monstera|Ficus/);
    expect(rows[0]).toHaveTextContent('Ficus');
  });

  it('scrolls to weather widget when setLocation param is present', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;

      renderWithProviders(<Dashboard />, { route: '/?setLocation=1' });

      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      expect(weatherWidgetMock).toHaveBeenCalledWith(
        expect.objectContaining({ locationSetupPrompt: true }),
      );

      await vi.advanceTimersByTimeAsync(150);

      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears setLocation param after weather location is set', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />, { route: '/?setLocation=1' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirm location' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Confirm location' }));

    await waitFor(() => {
      expect(weatherWidgetMock).toHaveBeenCalledWith(
        expect.objectContaining({ locationSetupPrompt: false }),
      );
    });
  });

  it('clears highlightPlant URL param and scrolls to plant', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;

      renderWithProviders(<Dashboard />, { route: '/?highlightPlant=1' });

      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      await vi.advanceTimersByTimeAsync(150);

      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows reset filters empty state when filters hide all plants', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Search plants…'), 'NoMatch');

    await waitFor(() => {
      expect(screen.getByText('No plants match your filters')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });
  });

  it('opens plant detail modal when a plant is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Monstera'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('reloads plants on manual refresh', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(fetchPlants).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'Refresh dashboard' }));

    await waitFor(() => {
      expect(fetchPlants).toHaveBeenCalledTimes(2);
    });
  });

  it('loads active snoozes with plants and unsnoozes from the leaderboard', async () => {
    const user = userEvent.setup();
    fetchActiveSnoozedPlants.mockResolvedValue(
      new Map([[1, new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()]]),
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Snoozed · \d+h left/ })).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Remove snooze'));

    expect(unsnoozeNotification).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('button', { name: /Snoozed · \d+h left/ })).not.toBeInTheDocument();
  });

  it('persists sort preference to localStorage', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Name (A-Z)'));

    expect(localStorage.getItem('plantir_dashboard_sort')).toBe('name');
  });

  it('sorts by humidity high and handles null humidity', async () => {
    const user = userEvent.setup();
    fetchPlants.mockResolvedValue([
      buildPlant({ id: 1, name: 'Alpha', humidityPercent: 30 }),
      buildPlant({ id: 2, name: 'Beta', humidityPercent: null }),
    ]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Humidity (highest first)'));

    const rows = screen.getAllByText(/Alpha|Beta/);
    expect(rows[0]).toHaveTextContent('Alpha');
  });

  it('navigates to plants center from empty plants state', async () => {
    const user = userEvent.setup();
    fetchPlants.mockResolvedValue([]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add first plant' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Add first plant' }));
  });

  it('closes plant detail modal', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Monstera'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('sorts by last seen with null timestamps', async () => {
    const user = userEvent.setup();
    fetchPlants.mockResolvedValue([
      buildPlant({ id: 1, name: 'Recent', lastMeasuredAt: '2026-07-06T10:00:00Z' }),
      buildPlant({ id: 2, name: 'Old', lastMeasuredAt: null }),
    ]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Last seen (recent first)'));

    const rows = screen.getAllByText(/Recent|Old/);
    expect(rows[0]).toHaveTextContent('Recent');
  });
});
