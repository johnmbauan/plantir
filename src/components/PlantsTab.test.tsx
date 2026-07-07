import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { buildPlant } from '@/test/builders/plant'
import PlantsTab from '@/components/PlantsTab'

vi.mock('@/services/plantService', () => ({
  fetchPlants: vi.fn(),
}))

const PlantFormModalMock = vi.fn<(props: unknown) => null>(() => null)
const PlantDeleteModalMock = vi.fn<(props: unknown) => null>(() => null)

vi.mock('@/components/PlantFormModal', () => ({
  default: (props: unknown) => PlantFormModalMock(props),
}))

vi.mock('@/components/PlantDeleteModal', () => ({
  default: (props: unknown) => PlantDeleteModalMock(props),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import { fetchPlants } from '@/services/plantService'

describe('PlantsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchPlants).mockResolvedValue([buildPlant()])
  })

  it('renders loaded plants', async () => {
    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)

    expect(await screen.findByText('Monstera')).toBeInTheDocument()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
  })

  it('shows empty state when there are no plants', async () => {
    vi.mocked(fetchPlants).mockResolvedValue([])
    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)

    expect(await screen.findByText('No plants yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add your first plant' })).toBeInTheDocument()
  })

  it('filters plants by search query', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant(),
      buildPlant({ id: 2, name: 'Fern' }),
    ])

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('Monstera')

    await user.type(screen.getByPlaceholderText('Search plants…'), 'fern')

    expect(screen.queryByText('Monstera')).not.toBeInTheDocument()
    expect(screen.getByText('Fern')).toBeInTheDocument()
  })

  it('sorts plants by name ascending', async () => {
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 2, name: 'Zebra' }),
      buildPlant({ id: 1, name: 'Apple' }),
    ])

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('Apple')

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Apple')
    expect(rows[2]).toHaveTextContent('Zebra')
  })

  it('shows no search results message when filter matches nothing', async () => {
    const user = userEvent.setup()

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('Monstera')

    await user.type(screen.getByPlaceholderText('Search plants…'), 'nomatch')

    expect(screen.getByText('No plants match your search.')).toBeInTheDocument()
  })

  it('shows error notification when loading fails', async () => {
    const { notifications } = await import('@mantine/notifications')
    vi.mocked(fetchPlants).mockRejectedValue(new Error('Load failed'))

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Load failed' }),
      )
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()
    const plant = buildPlant()

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('Monstera')

    await user.click(screen.getByRole('button', { name: 'Edit plant' }))

    expect(PlantFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingPlant: plant }),
    )
  })

  it('opens delete modal when delete button is clicked', async () => {
    const user = userEvent.setup()
    const plant = buildPlant()

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('Monstera')

    await user.click(screen.getByRole('button', { name: 'Delete plant' }))

    expect(PlantDeleteModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, plant }),
    )
  })

  it('opens add plant modal from Add Plant button', async () => {
    const user = userEvent.setup()

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('Monstera')

    await user.click(screen.getByRole('button', { name: 'Add Plant' }))

    expect(PlantFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingPlant: null }),
    )
  })

  it('opens edit modal from plantId URL param', async () => {
    const plant = buildPlant({ id: 7 })
    vi.mocked(fetchPlants).mockResolvedValue([plant])

    renderWithProviders(<PlantsTab reloadKey={0} onMutated={vi.fn()} />, {
      route: '/?plantId=7',
    })

    await waitFor(() => {
      expect(PlantFormModalMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true, editingPlant: plant }),
      )
    })
  })
})
