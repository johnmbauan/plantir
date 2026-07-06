import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import CompletedStep from './CompletedStep'

describe('CompletedStep', () => {
  it('renders success message with serial number', () => {
    renderWithProviders(<CompletedStep registeredSerial="SN-NEW-001" />)

    expect(screen.getByText('Device registered successfully')).toBeInTheDocument()
    expect(screen.getByText('SN-NEW-001')).toBeInTheDocument()
    expect(screen.getByText(/start sending readings shortly/i)).toBeInTheDocument()
  })

  it('renders without serial when not provided', () => {
    renderWithProviders(<CompletedStep registeredSerial={null} />)

    expect(screen.getByText('Device registered successfully')).toBeInTheDocument()
    expect(screen.queryByText('SN-NEW-001')).not.toBeInTheDocument()
  })
})
