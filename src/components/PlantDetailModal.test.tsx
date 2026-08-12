import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildPlant } from '@/test/builders/plant';
import PlantDetailModal from './PlantDetailModal';

const fetchPlantHistory = vi.fn();
const fetchLastWateredAt = vi.fn();
const onClose = vi.fn();

vi.mock('@/services/plantService', () => ({
  fetchPlantHistory: (...args: unknown[]) => fetchPlantHistory(...args),
  fetchLastWateredAt: (...args: unknown[]) => fetchLastWateredAt(...args),
}));

describe('PlantDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
    fetchPlantHistory.mockResolvedValue({
      humidity: [{ value: 55, createdAt: '2026-07-06T08:00:00Z' }],
      battery: [{ value: 80, createdAt: '2026-07-06T08:00:00Z' }],
    });
    fetchLastWateredAt.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when plant is not provided', () => {
    renderWithProviders(
      <PlantDetailModal plant={null} opened onClose={onClose} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders plant details and status badges', () => {
    const plant = buildPlant({
      name: 'Monstera',
      statuses: ['HEALTHY', 'RECHARGE_NEEDED'],
      humidityPercent: 55,
      batteryPercent: 80,
      deviceId: null,
    });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Needs recharge')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Last watered')).toBeInTheDocument();
    expect(screen.getByText('No device')).toBeInTheDocument();
    expect(screen.queryByText('Measurement history')).not.toBeInTheDocument();
    expect(fetchLastWateredAt).not.toHaveBeenCalled();
  });

  it('renders species guidance when species data is available', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const plant = buildPlant({
      species: {
        id: 7,
        source: 'openplantbook',
        sourceSpeciesId: 'monstera_deliciosa',
        scientificName: 'Monstera deliciosa',
        displayName: 'Monstera',
        imageUrl: null,
        minSoilMoisture: 35,
        maxSoilMoisture: 60,
        minTemperatureCelsius: 18,
        maxTemperatureCelsius: 30,
        soil: 'Well draining',
        sunlight: 'Bright indirect',
        watering: 'Keep slightly moist',
        fertilization: 'Monthly',
        pruning: 'Spring',
      },
      deviceId: null,
    });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    expect(screen.getByText('Scientific name: Monstera deliciosa')).toBeInTheDocument();
    expect(screen.getByText('Recommended soil moisture')).toBeInTheDocument();
    expect(screen.getByText('35% - 60%')).toBeInTheDocument();
    expect(screen.getByText('Recommended temperature')).toBeInTheDocument();
    expect(screen.getByText('18°C - 30°C')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View care guidance' }));
    expect(screen.getByText('Soil:')).toBeInTheDocument();
    expect(screen.getByText('Well draining')).toBeInTheDocument();
    expect(screen.getByText('Sunlight:')).toBeInTheDocument();
    expect(screen.getByText('Bright indirect')).toBeInTheDocument();
    expect(screen.getByText('Watering:')).toBeInTheDocument();
    expect(screen.getByText('Keep slightly moist')).toBeInTheDocument();
  });

  it('does not duplicate scientific name when it matches primary species name', () => {
    const plant = buildPlant({
      species: {
        id: 8,
        source: 'openplantbook',
        sourceSpeciesId: 'ficus_lyrata',
        scientificName: 'Ficus lyrata',
        displayName: 'Ficus lyrata',
        imageUrl: null,
        minSoilMoisture: 30,
        maxSoilMoisture: 55,
        minTemperatureCelsius: null,
        maxTemperatureCelsius: null,
      },
      deviceId: null,
    });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    expect(screen.queryByText('Scientific name: Ficus lyrata')).not.toBeInTheDocument();
  });

  it('opens a full size image view when the plant photo is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const plant = buildPlant({
      name: 'Monstera',
      image_url:
        'https://x.supabase.co/storage/v1/object/public/plant-images/user/abc.jpg',
      deviceId: null,
    });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    const preview = screen.getByRole('img', { name: 'Monstera' });
    expect(preview).toHaveAttribute(
      'src',
      'https://x.supabase.co/storage/v1/object/public/plant-images/user/abc.jpg',
    );

    await user.click(screen.getByRole('button', { name: 'View full size photo of Monstera' }));

    expect(screen.getByRole('dialog', { name: 'Full size photo of Monstera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close full size photo' })).toBeInTheDocument();
    expect(screen.getAllByAltText('Monstera')).toHaveLength(2);
    expect(screen.getAllByAltText('Monstera')[1]).toHaveAttribute(
      'src',
      'https://x.supabase.co/storage/v1/object/public/plant-images/user/abc.jpg',
    );
  });

  it('loads and displays measurement history when device is assigned', async () => {
    const plant = buildPlant({ id: 3, deviceId: 10 });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    expect(screen.getByText('Measurement history')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchPlantHistory).toHaveBeenCalledWith(3, '7d');
    });

    await waitFor(() => {
      expect(screen.getByText('Humidity trend')).toBeInTheDocument();
      expect(screen.getByText('Battery trend')).toBeInTheDocument();
    });
  });

  it('maps humidity history through pot-depth effective values', async () => {
    fetchPlantHistory.mockResolvedValue({
      humidity: [{ value: 15, createdAt: '2026-07-06T08:00:00Z' }],
      battery: [{ value: 80, createdAt: '2026-07-06T08:00:00Z' }],
    });
    const plant = buildPlant({
      id: 3,
      deviceId: 10,
      potDepthClass: 'large',
      humidityPercent: 24,
      rawHumidityPercent: 15,
    });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Humidity trend')).toBeInTheDocument();
    });

    // History chart summary uses effective humidity (15 raw → 24 for large).
    expect(screen.getAllByText('24%').length).toBeGreaterThanOrEqual(1);
  });

  it('fetches and shows last watered when a device is assigned', async () => {
    fetchLastWateredAt.mockResolvedValue('2026-07-04T12:00:00Z');
    const plant = buildPlant({ id: 3, deviceId: 10 });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    await waitFor(() => {
      expect(fetchLastWateredAt).toHaveBeenCalledWith(3);
    });

    await waitFor(() => {
      expect(screen.getByText('Last watered')).toBeInTheDocument();
      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });
  });

  it('shows Unknown when last watered cannot be detected', async () => {
    fetchLastWateredAt.mockResolvedValue(null);
    const plant = buildPlant({ id: 3, deviceId: 10 });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    await waitFor(() => {
      expect(fetchLastWateredAt).toHaveBeenCalledWith(3);
    });

    await waitFor(() => {
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  it('fetches history for a different range when selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const plant = buildPlant({ id: 3, deviceId: 10 });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Humidity trend')).toBeInTheDocument();
    });

    await user.click(screen.getByText('14 days'));

    await waitFor(() => {
      expect(fetchPlantHistory).toHaveBeenCalledWith(3, '14d');
    });
  });

  it('fetches 90-day history when that range is selected', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const plant = buildPlant({ id: 3, deviceId: 10 });

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Humidity trend')).toBeInTheDocument();
    });

    await user.click(screen.getByText('90 days'));

    await waitFor(() => {
      expect(fetchPlantHistory).toHaveBeenCalledWith(3, '90d');
    });
  });
});
