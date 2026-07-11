import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildPlant } from '@/test/builders/plant';
import { buildSession } from '@/test/builders/session';
import { mockAuthenticatedUser, mockSession, resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
import Dashboard from './Dashboard';

const fetchPlants = vi.fn();

vi.mock('@/services/plantService', () => ({
  fetchPlants: (...args: unknown[]) => fetchPlants(...args),
}));

vi.mock('@/components/WeatherWidget', () => ({
  default: () => <div>Weather widget</div>,
}));

vi.mock('@/components/OnboardingChecklist', () => ({
  default: () => null,
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

type PostgresHandler = () => void
type SubscribeCallback = (status: string) => void

let humidityInsertHandler: PostgresHandler | undefined;
let batteryInsertHandler: PostgresHandler | undefined;
let subscribeCallback: SubscribeCallback | undefined;

function setupDashboardChannelMock() {
  humidityInsertHandler = undefined;
  batteryInsertHandler = undefined;
  subscribeCallback = undefined;

  vi.mocked(supabaseMock.channel).mockImplementation(() => {
    const chain = {
      on: vi.fn((event: string, config: { table?: string }, handler: PostgresHandler) => {
        if (event === 'postgres_changes' && config.table === 'humidity_measurements') {
          humidityInsertHandler = handler;
        }
        if (event === 'postgres_changes' && config.table === 'battery_measurements') {
          batteryInsertHandler = handler;
        }
        return chain;
      }),
      subscribe: vi.fn((cb?: SubscribeCallback) => {
        subscribeCallback = cb;
        cb?.('SUBSCRIBED');
        return 'channel';
      }),
    };
    return chain;
  });
}

describe('Dashboard', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    setupDashboardChannelMock();
    mockAuthenticatedUser();
    mockSession(buildSession());
    vi.clearAllMocks();
    localStorage.clear();
    fetchPlants.mockResolvedValue([
      buildPlant({ id: 1, name: 'Monstera', humidityPercent: 40 }),
      buildPlant({ id: 2, name: 'Ficus', humidityPercent: 70, statuses: ['WATERING_NEEDED'] }),
    ]);
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

    await user.click(screen.getByRole('textbox', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Name (A-Z)'));

    const rows = screen.getAllByText(/Monstera|Ficus/);
    expect(rows[0]).toHaveTextContent('Ficus');
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

  it('shows realtime unavailable warning on channel error', async () => {
    const { notifications } = await import('@mantine/notifications');

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    subscribeCallback?.('CHANNEL_ERROR');

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Realtime unavailable' }),
    );
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

  it('reloads plants after realtime humidity insert', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalledTimes(1);
      });

      humidityInsertHandler?.();

      await vi.advanceTimersByTimeAsync(800);

      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalledTimes(2);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('reloads plants after realtime battery insert', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalledTimes(1);
      });

      batteryInsertHandler?.();

      await vi.advanceTimersByTimeAsync(800);

      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalledTimes(2);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('persists sort preference to localStorage', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('textbox', { name: 'Sort plants' }));
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

    await user.click(screen.getByRole('textbox', { name: 'Sort plants' }));
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

    await user.click(screen.getByRole('textbox', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Last seen (recent first)'));

    const rows = screen.getAllByText(/Recent|Old/);
    expect(rows[0]).toHaveTextContent('Recent');
  });
});
