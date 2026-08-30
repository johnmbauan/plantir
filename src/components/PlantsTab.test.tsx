import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'react-router-dom';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';
import { buildPlant } from '@/test/builders/plant';
import type { PlantSpeciesSummary } from '@/types';
import PlantsTab from '@/components/PlantsTab';

const mockNavigate = vi.fn();
const markOnboardingStepComplete = vi.fn();

vi.mock('@/services/onboardingService', () => ({
  markOnboardingStepComplete: (...args: unknown[]) => markOnboardingStepComplete(...args),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/plantService', () => ({
  fetchPlants: vi.fn(),
}));

const PlantFormModalMock = vi.fn<(props: unknown) => null>(() => null);
const PlantDeleteModalMock = vi.fn<(props: unknown) => null>(() => null);

vi.mock('@/components/PlantFormModal', () => ({
  default: (props: unknown) => PlantFormModalMock(props),
}));

vi.mock('@/components/PlantDeleteModal', () => ({
  default: (props: unknown) => PlantDeleteModalMock(props),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

import { fetchPlants } from '@/services/plantService';

function buildSpecies(overrides: Partial<PlantSpeciesSummary> = {}): PlantSpeciesSummary {
  return {
    id: 10,
    source: 'perenual',
    sourceSpeciesId: '42',
    scientificName: 'Monstera deliciosa',
    displayName: 'Swiss cheese plant',
    imageUrl: null,
    minSoilMoisture: null,
    maxSoilMoisture: null,
    minTemperatureCelsius: null,
    maxTemperatureCelsius: null,
    ...overrides,
  };
}

function SearchParamsSpy() {
  const [params] = useSearchParams();
  return <div data-testid="params">{params.toString()}</div>;
}

function lastPlantFormOnSaved() {
  const calls = PlantFormModalMock.mock.calls;
  const props = calls[calls.length - 1]?.[0] as { onSaved: () => void };
  return props.onSaved;
}

describe('PlantsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    markOnboardingStepComplete.mockReset();
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: true, dismissed: false });
    localStorage.clear();
    vi.mocked(fetchPlants).mockResolvedValue([buildPlant()]);
  });

  it('renders loaded plants with moisture and does not show a redundant Plants heading', async () => {
    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);

    expect(await screen.findByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('/ 15%')).toBeInTheDocument();
    expect(screen.queryByText('Plants')).not.toBeInTheDocument();
  });

  it('renders expanded status chips and icon-only action chips without label expansion', async () => {
    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);

    expect(await screen.findByText('Monstera')).toBeInTheDocument();

    const healthy = screen.getByRole('button', { name: 'Healthy' });
    expect(healthy).toHaveClass('filter-chip--healthy');
    expect(healthy).not.toHaveClass('filter-chip--icon-only');

    const edit = screen.getByRole('button', { name: 'Edit plant' });
    expect(edit).toHaveClass('filter-chip--edit');
    expect(edit).toHaveClass('filter-chip--icon-only');
    expect(edit).not.toHaveClass('filter-chip--expand-label');

    const remove = screen.getByRole('button', { name: 'Delete plant' });
    expect(remove).toHaveClass('filter-chip--danger');
    expect(remove).toHaveClass('filter-chip--icon-only');
    expect(remove).not.toHaveClass('filter-chip--expand-label');
  });

  it('shows outdoor indicator and species subtitle when present', async () => {
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({
        is_outdoor: true,
        species: buildSpecies({ displayName: 'Bird of paradise' }),
      }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);

    expect(await screen.findByLabelText('Outdoor plant')).toBeInTheDocument();
    expect(screen.getByText('Bird of paradise')).toBeInTheDocument();
  });

  it('shows empty state when there are no plants', async () => {
    vi.mocked(fetchPlants).mockResolvedValue([]);
    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);

    expect(await screen.findByText('No plants yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add your first plant' })).toBeInTheDocument();
  });

  it('filters plants by search query', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant(),
      buildPlant({ id: 2, name: 'Fern' }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.type(screen.getByPlaceholderText('Search plants…'), 'fern');

    expect(screen.queryByText('Monstera')).not.toBeInTheDocument();
    expect(screen.getByText('Fern')).toBeInTheDocument();
  });

  it('filters plants by species name and device serial', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 1, name: 'Alpha', species: buildSpecies({ displayName: 'Pothos' }) }),
      buildPlant({ id: 2, name: 'Beta', serialNumber: 'SN-ZZZ', species: null }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Alpha');

    await user.type(screen.getByPlaceholderText('Search plants…'), 'pothos');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search plants…'));
    await user.type(screen.getByPlaceholderText('Search plants…'), 'zzz');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('sorts plants by name ascending by default', async () => {
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 1, name: 'Mango' }),
      buildPlant({ id: 2, name: 'Zebra' }),
      buildPlant({ id: 3, name: 'Apple' }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Apple');

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple');
    expect(rows[2]).toHaveTextContent('Mango');
    expect(rows[3]).toHaveTextContent('Zebra');
  });

  it('toggles name sort direction when the Name header is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 1, name: 'Mango' }),
      buildPlant({ id: 2, name: 'Zebra' }),
      buildPlant({ id: 3, name: 'Apple' }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Apple');

    await user.click(screen.getByRole('button', { name: 'Sort by Name' }));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Zebra');
    expect(rows[2]).toHaveTextContent('Mango');
    expect(rows[3]).toHaveTextContent('Apple');
  });

  it('sorts by moisture when the Moisture header is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 1, name: 'Mid', humidityPercent: 50 }),
      buildPlant({ id: 2, name: 'High', humidityPercent: 80 }),
      buildPlant({ id: 3, name: 'Low', humidityPercent: 20 }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Mid');

    await user.click(screen.getByRole('button', { name: 'Sort by Moisture' }));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Low');
    expect(rows[2]).toHaveTextContent('Mid');
    expect(rows[3]).toHaveTextContent('High');
  });

  it('shows an em dash when moisture is missing', async () => {
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ humidityPercent: null, threshold: null }),
    ]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows no search results message when search matches nothing', async () => {
    const user = userEvent.setup();

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.type(screen.getByPlaceholderText('Search plants…'), 'nomatch');

    expect(screen.getByText('No plants match your search.')).toBeInTheDocument();
  });

  it('shows error notification when loading fails', async () => {
    const { notifications } = await import('@mantine/notifications');
    vi.mocked(fetchPlants).mockRejectedValue(new Error('Load failed'));

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Load failed' }),
      );
    });
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    const plant = buildPlant();

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Edit plant' }));

    expect(PlantFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingPlant: plant }),
    );
  });

  it('opens delete modal when delete button is clicked', async () => {
    const user = userEvent.setup();
    const plant = buildPlant();

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Delete plant' }));

    expect(PlantDeleteModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, plant }),
    );
  });

  it('renders the toolbar with search and Add Plant action', async () => {
    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    expect(screen.getByRole('button', { name: 'Search plants' })).toBeInTheDocument();

    const addPlant = screen.getByRole('button', { name: 'Add Plant' });
    expect(screen.getByTestId('center-tab-toolbar-actions')).toContainElement(addPlant);
  });

  it('returns to the dashboard after completing the plants onboarding step', async () => {
    const user = userEvent.setup();
    const onMutated = vi.fn();

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={onMutated} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Add Plant' }));
    lastPlantFormOnSaved()();

    expect(onMutated).toHaveBeenCalledTimes(1);
    expect(markOnboardingStepComplete).toHaveBeenCalledWith('plants');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('stays on plants center after creating a plant when that step is already complete', async () => {
    const user = userEvent.setup();
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: false, dismissed: false });

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Add Plant' }));
    lastPlantFormOnSaved()();

    await waitFor(() => {
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('plants');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('returns to the dashboard after the first plant even if onboarding was dismissed', async () => {
    const user = userEvent.setup();
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: true, dismissed: true });

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Add Plant' }));
    lastPlantFormOnSaved()();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('stays on plants center after editing a plant during onboarding', async () => {
    const user = userEvent.setup();

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Edit plant' }));
    lastPlantFormOnSaved()();

    expect(markOnboardingStepComplete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens add plant modal from Add Plant button', async () => {
    const user = userEvent.setup();

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    await user.click(screen.getByRole('button', { name: 'Add Plant' }));

    expect(PlantFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingPlant: null }),
    );
  });

  it('opens edit modal from plantId URL param', async () => {
    const plant = buildPlant({ id: 7 });
    vi.mocked(fetchPlants).mockResolvedValue([plant]);

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />, {
      route: '/?plantId=7',
    });

    await waitFor(() => {
      expect(PlantFormModalMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true, editingPlant: plant }),
      );
    });
  });

  describe('Assigned Device column', () => {
    it('renders a sortable Assigned Device column header', async () => {
      renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
      await screen.findByText('Monstera');

      expect(screen.getByRole('button', { name: 'Sort by Assigned Device' })).toBeInTheDocument();
      expect(
        within(screen.getByRole('columnheader', { name: /Assigned Device/ })).getByText(
          'Assigned Device',
        ),
      ).toBeInTheDocument();
    });

    it('shows the serial number as a clickable element when a device is assigned', async () => {
      vi.mocked(fetchPlants).mockResolvedValue([buildPlant({ deviceId: 1, serialNumber: 'SN-ABC' })]);
      renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
      await screen.findByText('Monstera');

      expect(screen.getByText('SN-ABC')).toBeInTheDocument();
    });

    it('shows None and Assign when no device is assigned', async () => {
      vi.mocked(fetchPlants).mockResolvedValue([
        buildPlant({ deviceId: null, serialNumber: null, statuses: ['OFFLINE'] }),
      ]);
      renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />);
      await screen.findByText('Monstera');

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Assign')).toBeInTheDocument();
      expect(screen.queryByText('SN-')).not.toBeInTheDocument();
    });

    it('switches to devices tab with deviceId when the serial number is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(fetchPlants).mockResolvedValue([buildPlant({ deviceId: 5, serialNumber: 'SN-XYZ' })]);

      renderWithProviders(
        <>
          <PlantsTab reloadKey={0} onMutated={vi.fn()} />
          <SearchParamsSpy />
        </>,
      );
      await screen.findByText('Monstera');

      await user.click(screen.getByText('SN-XYZ'));

      await waitFor(() => {
        expect(screen.getByTestId('params').textContent).toBe('tab=devices&deviceId=5');
      });
    });

    it('switches to devices tab when Assign is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(fetchPlants).mockResolvedValue([
        buildPlant({ deviceId: null, serialNumber: null, statuses: ['OFFLINE'] }),
      ]);

      renderWithProviders(
        <>
          <PlantsTab reloadKey={0} onMutated={vi.fn()} />
          <SearchParamsSpy />
        </>,
      );
      await screen.findByText('Monstera');

      await user.click(screen.getByText('Assign'));

      await waitFor(() => {
        expect(screen.getByTestId('params').textContent).toBe('tab=devices');
      });
    });
  });
});
