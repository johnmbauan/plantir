import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import PrepareStep from './PrepareStep'

describe('PrepareStep', () => {
  it('renders calibration prerequisites', () => {
    renderWithProviders(<PrepareStep />)

    expect(screen.getByText('Before you start')).toBeInTheDocument()
    expect(screen.getByText(/completely dry.*completely wet/i)).toBeInTheDocument()
    expect(screen.getByText('Your Plantir device')).toBeInTheDocument()
    expect(screen.getByText('A small glass of water')).toBeInTheDocument()
  })
})
