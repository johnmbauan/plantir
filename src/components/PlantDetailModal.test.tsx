import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { buildPlant } from '@/test/builders/plant'
import PlantDetailModal from './PlantDetailModal'

const fetchPlantHistory = vi.fn()
const onClose = vi.fn()

vi.mock('@/services/plantService', () => ({
  fetchPlantHistory: (...args: unknown[]) => fetchPlantHistory(...args),
}))

describe('PlantDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchPlantHistory.mockResolvedValue({
      humidity: [{ value: 55, createdAt: '2026-07-06T08:00:00Z' }],
      battery: [{ value: 80, createdAt: '2026-07-06T08:00:00Z' }],
    })
  })

  it('returns null when plant is not provided', () => {
    renderWithProviders(
      <PlantDetailModal plant={null} opened onClose={onClose} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders plant details and status badges', () => {
    const plant = buildPlant({
      name: 'Monstera',
      statuses: ['HEALTHY', 'RECHARGE_NEEDED'],
      humidityPercent: 55,
      batteryPercent: 80,
      deviceId: null,
    })

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    )

    expect(screen.getByText('Monstera')).toBeInTheDocument()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.getByText('Needs recharge')).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
    expect(screen.getByText(/🔋 80%/)).toBeInTheDocument()
    expect(screen.queryByText('Measurement history')).not.toBeInTheDocument()
  })

  it('renders species guidance when species data is available', () => {
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
    })

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    )

    expect(screen.getByText('Scientific name: Monstera deliciosa')).toBeInTheDocument()
    expect(screen.getByText(/Recommended soil moisture 💧:/)).toBeInTheDocument()
    expect(screen.getByText('35% - 60%')).toBeInTheDocument()
    expect(screen.getByText(/Recommended temperature 🌡️:/)).toBeInTheDocument()
    expect(screen.getByText('18°C - 30°C')).toBeInTheDocument()
    expect(screen.getByText('Soil 🌱:')).toBeInTheDocument()
    expect(screen.getByText('Well draining')).toBeInTheDocument()
    expect(screen.getByText('Sunlight ☀️:')).toBeInTheDocument()
    expect(screen.getByText('Bright indirect')).toBeInTheDocument()
    expect(screen.getByText('Watering 🚿:')).toBeInTheDocument()
    expect(screen.getByText('Keep slightly moist')).toBeInTheDocument()
  })

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
    })

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    )

    expect(screen.queryByText('Scientific name: Ficus lyrata')).not.toBeInTheDocument()
  })

  it('loads and displays measurement history when device is assigned', async () => {
    const plant = buildPlant({ id: 3, deviceId: 10 })

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    )

    expect(screen.getByText('Measurement history')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchPlantHistory).toHaveBeenCalledWith(3, '24h')
    })

    await waitFor(() => {
      expect(screen.getByText('Humidity trend')).toBeInTheDocument()
      expect(screen.getByText('Battery trend')).toBeInTheDocument()
    })
  })

  it('fetches history for a different range when selected', async () => {
    const user = userEvent.setup()
    const plant = buildPlant({ id: 3, deviceId: 10 })

    renderWithProviders(
      <PlantDetailModal plant={plant} opened onClose={onClose} />,
    )

    await waitFor(() => {
      expect(screen.getByText('Humidity trend')).toBeInTheDocument()
    })

    await user.click(screen.getByText('7d'))

    await waitFor(() => {
      expect(fetchPlantHistory).toHaveBeenCalledWith(3, '7d')
    })
  })
})
