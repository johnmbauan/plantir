import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import PlantCenter from './PlantCenter'

vi.mock('@/components/PlantsTab', () => ({
  default: () => <div>Plants tab content</div>,
}))

vi.mock('@/components/DevicesTab', () => ({
  default: () => <div>Devices tab content</div>,
}))

describe('PlantCenter', () => {
  it('renders plants tab by default', () => {
    renderWithProviders(<PlantCenter />)

    expect(screen.getByRole('heading', { name: 'Plants Center' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Plants' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('Plants tab content')).toBeInTheDocument()
  })

  it('switches to devices tab', async () => {
    const user = userEvent.setup()

    renderWithProviders(<PlantCenter />, { route: '/plants-center?tab=plants' })

    await user.click(screen.getByRole('tab', { name: 'Devices' }))

    expect(screen.getByText('Devices tab content')).toBeInTheDocument()
  })

  it('opens devices tab from URL param', () => {
    renderWithProviders(<PlantCenter />, { route: '/plants-center?tab=devices' })

    expect(screen.getByRole('tab', { name: 'Devices' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('Devices tab content')).toBeInTheDocument()
  })
})
