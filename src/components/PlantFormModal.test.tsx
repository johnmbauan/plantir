import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '@/test/render'
import { buildPlant } from '@/test/builders/plant'
import PlantFormModal from './PlantFormModal'

const createPlant = vi.fn()
const updatePlant = vi.fn()
const uploadPlantImage = vi.fn()
const deletePlantImage = vi.fn()
const onClose = vi.fn()
const onSaved = vi.fn()

vi.mock('@/services/plantService', () => ({
  createPlant: (...args: unknown[]) => createPlant(...args),
  updatePlant: (...args: unknown[]) => updatePlant(...args),
  uploadPlantImage: (...args: unknown[]) => uploadPlantImage(...args),
  deletePlantImage: (...args: unknown[]) => deletePlantImage(...args),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

function getDialog() {
  return screen.getByRole('dialog')
}

describe('PlantFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createPlant.mockResolvedValue({ id: 1 })
    updatePlant.mockResolvedValue(undefined)
  })

  it('renders add plant form when not editing', () => {
    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByPlaceholderText('e.g. Ficus')).toHaveValue('')
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('prefills fields when editing a plant', () => {
    const plant = buildPlant({ name: 'Monstera', image_url: 'https://example.com/plant.jpg' })

    renderWithProviders(
      <PlantFormModal opened editingPlant={plant} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByPlaceholderText('e.g. Ficus')).toHaveValue('Monstera')
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('creates a new plant on save', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <PlantFormModal opened editingPlant={null} onClose={onClose} onSaved={onSaved} />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'Ficus')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(createPlant).toHaveBeenCalledWith('Ficus', null)
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
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(updatePlant).toHaveBeenCalledWith(5, 'Big Monstera', null)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledTimes(1)
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
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

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
    // Mantine FileButton nests a hidden file input.
    // eslint-disable-next-line testing-library/no-node-access
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeTruthy()

    await user.upload(input, file)
    await user.type(within(dialog).getByPlaceholderText('e.g. Ficus'), 'Ficus')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(deletePlantImage).toHaveBeenCalledWith(null)
    expect(uploadPlantImage).toHaveBeenCalledWith(file)
    expect(createPlant).toHaveBeenCalledWith('Ficus', 'https://cdn/plant.jpg')
  })
})
