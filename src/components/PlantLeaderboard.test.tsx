import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import { buildPlant } from '@/test/builders/plant'
import PlantLeaderboard from './PlantLeaderboard'

describe('PlantLeaderboard', () => {
  it('shows loading skeletons while loading', () => {
    renderWithProviders(<PlantLeaderboard plants={[]} loading />)
    expect(screen.queryByText('Monstera')).not.toBeInTheDocument()
  })

  it('renders plant rows when data is loaded', () => {
    renderWithProviders(
      <PlantLeaderboard plants={[buildPlant({ name: 'Monstera' })]} loading={false} />,
    )
    expect(screen.getByText('Monstera')).toBeInTheDocument()
  })

  it('shows empty state with action', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()

    renderWithProviders(
      <PlantLeaderboard
        plants={[]}
        loading={false}
        emptyState={{
          title: 'No plants yet',
          actionLabel: 'Add first plant',
          onAction,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add first plant' }))
    expect(onAction).toHaveBeenCalled()
  })

  it('calls onPlantClick when a row is clicked', async () => {
    const user = userEvent.setup()
    const plant = buildPlant({ id: 5, name: 'Fern' })
    const onPlantClick = vi.fn()

    renderWithProviders(
      <PlantLeaderboard plants={[plant]} loading={false} onPlantClick={onPlantClick} />,
    )

    await user.click(screen.getByText('Fern'))
    expect(onPlantClick).toHaveBeenCalledWith(plant)
  })
})
