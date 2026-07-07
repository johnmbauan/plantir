import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, within } from '@/test/render'
import { buildPlant } from '@/test/builders/plant'
import PlantFormModal from './PlantFormModal'
import type { PlantSpecies } from '@/types'

const createPlant = vi.fn()
const updatePlant = vi.fn()
const uploadPlantImage = vi.fn()
const deletePlantImage = vi.fn()
const searchPlantSpecies = vi.fn()
const fetchPlantSpeciesDetail = vi.fn()
const onClose = vi.fn()
const onSaved = vi.fn()

vi.mock('@/services/plantService', () => ({
  createPlant: (...args: unknown[]) => createPlant(...args),
  updatePlant: (...args: unknown[]) => updatePlant(...args),
  uploadPlantImage: (...args: unknown[]) => uploadPlantImage(...args),
  deletePlantImage: (...args: unknown[]) => deletePlantImage(...args),
}))

vi.mock('@/services/plantSpeciesService', () => ({
  searchPlantSpecies: (...args: unknown[]) => searchPlantSpecies(...args),
  fetchPlantSpeciesDetail: (...args: unknown[]) => fetchPlantSpeciesDetail(...args),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

function getDialog() {
  return screen.getByRole('dialog')
}

describe('PlantFormModal', () => {
  const speciesDetail: PlantSpecies = {
    id: 7,
    source: 'openplantbook',
    sourceSpeciesId: 'monstera_deliciosa',
    scientificName: 'Monstera deliciosa',
    displayName: 'Monstera',
    imageUrl: 'https://cdn/monstera.jpg',
    minSoilMoisture: 35,
    maxSoilMoisture: 60,
    commonNames: ['Monstera'],
    minEnvHumidity: 40,
    maxEnvHumidity: 70,
    minTemperatureCelsius: 18,
    maxTemperatureCelsius: 30,
    sunlight: 'Bright indirect light',
    soil: 'Well draining',
    watering: 'Keep slightly moist',
    fertilization: 'Monthly',
    pruning: 'As needed',
    sourceUpdatedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    createPlant.mockResolvedValue({ id: 1 })
    updatePlant.mockResolvedValue(undefined)
    searchPlantSpecies.mockResolvedValue([])
    fetchPlantSpeciesDetail.mockResolvedValue(speciesDetail)
  })

  it('renders add plant form when not editing', () => {
    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByPlaceholderText('e.g. Ficus')).toHaveValue('')
    expect(within(dialog).getByRole('button', { name: 'Add plant' })).toBeDisabled()
  })

  it('prefills fields when editing a plant', () => {
    const plant = buildPlant({ name: 'Monstera', image_url: 'https://example.com/plant.jpg' })

    renderWithProviders(
      <PlantFormModal opened editingPlant={plant} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByPlaceholderText('e.g. Ficus')).toHaveValue('Monstera')
    expect(within(dialog).getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('creates a new plant on save', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'Ficus')
    await user.click(within(dialog).getByRole('button', { name: 'Add plant' }))

    expect(createPlant).toHaveBeenCalledWith('Ficus', null, null)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('updates an existing plant on save', async () => {
    const user = userEvent.setup()
    const plant = buildPlant({ id: 5, name: 'Monstera' })

    renderWithProviders(
      <PlantFormModal opened editingPlant={plant} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    const nameInput = within(dialog).getByPlaceholderText('e.g. Ficus')
    await user.clear(nameInput)
    await user.type(nameInput, 'Big Monstera')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(updatePlant).toHaveBeenCalledWith(5, 'Big Monstera', null, null)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('enables save changes when editing a plant and selecting its first species', async () => {
    const user = userEvent.setup()
    const plant = buildPlant({ id: 5, name: 'Monstera', speciesId: null, species: null })
    searchPlantSpecies.mockResolvedValue([
      {
        source: 'openplantbook',
        sourceSpeciesId: 'monstera_deliciosa',
        scientificName: 'Monstera deliciosa',
        displayName: 'Monstera',
        imageUrl: null,
      },
    ])

    renderWithProviders(
      <PlantFormModal opened editingPlant={plant} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    const saveButton = within(dialog).getByRole('button', { name: 'Save changes' })
    expect(saveButton).toBeDisabled()

    const speciesInput = within(dialog).getByRole('textbox', { name: 'Plant species (optional)' })
    await user.type(speciesInput, 'mons')
    await waitFor(() => {
      expect(searchPlantSpecies).toHaveBeenCalledWith('mons')
    })

    await user.type(speciesInput, '{ArrowDown}{Enter}')
    await waitFor(() => {
      expect(fetchPlantSpeciesDetail).toHaveBeenCalledWith('monstera_deliciosa')
    })
    await waitFor(() => {
      expect(saveButton).toBeEnabled()
    })

    await user.click(saveButton)
    expect(updatePlant).toHaveBeenCalledWith(5, 'Monstera', null, 7)
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    await user.click(within(getDialog()).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows error notification when save fails', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    createPlant.mockRejectedValue(new Error('Save failed'))

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'Ficus')
    await user.click(within(dialog).getByRole('button', { name: 'Add plant' }))

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error', message: 'Save failed' }),
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('uploads image when creating a plant with photo', async () => {
    const user = userEvent.setup()
    uploadPlantImage.mockResolvedValue('https://cdn/plant.jpg')

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    const file = new File(['img'], 'plant.jpg', { type: 'image/jpeg' })
    // eslint-disable-next-line testing-library/no-node-access
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeTruthy()

    await user.upload(input, file)
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'Ficus')
    await user.click(within(dialog).getByRole('button', { name: 'Add plant' }))

    expect(deletePlantImage).toHaveBeenCalledWith(null)
    expect(uploadPlantImage).toHaveBeenCalledWith(file)
    expect(createPlant).toHaveBeenCalledWith('Ficus', 'https://cdn/plant.jpg', null)
  })

  it('saves selected species without extra confirmation step', async () => {
    const user = userEvent.setup()
    searchPlantSpecies.mockResolvedValue([
      {
        source: 'openplantbook',
        sourceSpeciesId: 'monstera_deliciosa',
        scientificName: 'Monstera deliciosa',
        displayName: 'Monstera',
        imageUrl: null,
      },
    ])

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'My Plant')
    const speciesInput = within(dialog).getByRole('textbox', { name: 'Plant species (optional)' })
    await user.type(speciesInput, 'mons')

    await waitFor(() => {
      expect(searchPlantSpecies).toHaveBeenCalledWith('mons')
    })

    await user.type(speciesInput, '{ArrowDown}{Enter}')

    await waitFor(() => {
      expect(fetchPlantSpeciesDetail).toHaveBeenCalledWith('monstera_deliciosa')
    })
    await user.click(within(dialog).getByRole('button', { name: 'View care guidance' }))
    expect(within(dialog).getByText('18°C - 30°C')).toBeInTheDocument()

    const saveButton = within(dialog).getByRole('button', { name: 'Add plant' })
    expect(saveButton).toBeEnabled()

    await user.click(saveButton)
    expect(createPlant).toHaveBeenCalledWith('My Plant', null, 7)
  })

  it('clears selected species when user rejects suggestion', async () => {
    const user = userEvent.setup()
    searchPlantSpecies.mockResolvedValue([
      {
        source: 'openplantbook',
        sourceSpeciesId: 'monstera_deliciosa',
        scientificName: 'Monstera deliciosa',
        displayName: 'Monstera',
        imageUrl: null,
      },
    ])

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'My Plant')
    const speciesInput = within(dialog).getByRole('textbox', { name: 'Plant species (optional)' })
    await user.type(speciesInput, 'mons')
    await waitFor(() => {
      expect(searchPlantSpecies).toHaveBeenCalledWith('mons')
    })
    await user.type(speciesInput, '{ArrowDown}{Enter}')
    await waitFor(() => {
      expect(fetchPlantSpeciesDetail).toHaveBeenCalledWith('monstera_deliciosa')
    })
    expect(within(dialog).getByText('Care guidance')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Clear species' }))
    expect(within(dialog).queryByText('Care guidance')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Add plant' }))
    expect(createPlant).toHaveBeenCalledWith('My Plant', null, null)
  })

  it('allows using confirmed species image without custom upload', async () => {
    const user = userEvent.setup()
    searchPlantSpecies.mockResolvedValue([
      {
        source: 'openplantbook',
        sourceSpeciesId: 'monstera_deliciosa',
        scientificName: 'Monstera deliciosa',
        displayName: 'Monstera',
        imageUrl: 'https://cdn/monstera.jpg',
      },
    ])

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'My Plant')
    const speciesInput = within(dialog).getByRole('textbox', { name: 'Plant species (optional)' })
    await user.type(speciesInput, 'mons')
    await waitFor(() => {
      expect(searchPlantSpecies).toHaveBeenCalledWith('mons')
    })
    await user.type(speciesInput, '{ArrowDown}{Enter}')
    await waitFor(() => {
      expect(fetchPlantSpeciesDetail).toHaveBeenCalledWith('monstera_deliciosa')
    })

    await user.click(within(dialog).getByRole('radio', { name: 'Use species photo' }))
    await user.click(within(dialog).getByRole('button', { name: 'Add plant' }))

    expect(uploadPlantImage).not.toHaveBeenCalled()
    expect(createPlant).toHaveBeenCalledWith('My Plant', 'https://cdn/monstera.jpg', 7)
  })
})
