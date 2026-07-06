import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import WateringAlertsSection from './WateringAlertsSection'

describe('WateringAlertsSection', () => {
  it('renders threshold value and description', () => {
    renderWithProviders(
      <WateringAlertsSection
        threshold={25}
        validation={{}}
        onThresholdChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Watering alerts')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText(/Alert when humidity drops below/i)).toBeInTheDocument()
  })

  it('shows validation error when threshold is invalid', () => {
    renderWithProviders(
      <WateringAlertsSection
        threshold={25}
        validation={{ threshold: 'Threshold must be between 0 and 100' }}
        onThresholdChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Threshold must be between 0 and 100')).toBeInTheDocument()
  })
})
