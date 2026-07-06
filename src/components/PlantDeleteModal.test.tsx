import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '@/test/render'
import { buildPlant } from '@/test/builders/plant'
import PlantDeleteModal from './PlantDeleteModal'

const deletePlant = vi.fn()
const onClose = vi.fn()
const onDeleted = vi.fn()

vi.mock('@/services/plantService', () => ({
  deletePlant: (...args: unknown[]) => deletePlant(...args),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

function getDialog() {
  return screen.getByRole('dialog')
}

describe('PlantDeleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deletePlant.mockResolvedValue(undefined)
  })

  it('renders plant name in confirmation message', () => {
    const plant = buildPlant({ name: 'Fiddle Leaf' })

    renderWithProviders(
      <PlantDeleteModal opened plant={plant} onClose={onClose} onDeleted={onDeleted} />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByText('Fiddle Leaf')).toBeInTheDocument()
    expect(within(dialog).getByText(/devices currently assigned/i)).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <PlantDeleteModal opened plant={buildPlant()} onClose={onClose} onDeleted={onDeleted} />,
    )

    await user.click(within(getDialog()).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(deletePlant).not.toHaveBeenCalled()
  })

  it('deletes plant and calls callbacks on confirm', async () => {
    const user = userEvent.setup()
    const plant = buildPlant({ id: 42 })

    renderWithProviders(
      <PlantDeleteModal opened plant={plant} onClose={onClose} onDeleted={onDeleted} />,
    )

    await user.click(within(getDialog()).getByRole('button', { name: 'Delete' }))

    expect(deletePlant).toHaveBeenCalledWith(42)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDeleted).toHaveBeenCalledTimes(1)
  })

  it('shows error notification when delete fails', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    deletePlant.mockRejectedValue(new Error('Delete failed'))

    renderWithProviders(
      <PlantDeleteModal opened plant={buildPlant()} onClose={onClose} onDeleted={onDeleted} />,
    )

    await user.click(within(getDialog()).getByRole('button', { name: 'Delete' }))

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error', message: 'Delete failed' }),
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
