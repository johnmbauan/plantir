import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import { WeatherDaySlot } from '@/components/WeatherWidget/WeatherDaySlot'

describe('WeatherDaySlot', () => {
  it('shows today label for the first day', () => {
    renderWithProviders(
      <WeatherDaySlot
        day={{ date: '2026-07-06', maxTemp: 28, minTemp: 18, weatherCode: 0 }}
        index={0}
      />,
    )

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('28°')).toBeInTheDocument()
    expect(screen.getByText('18°')).toBeInTheDocument()
  })

  it('shows tomorrow label for the second day', () => {
    renderWithProviders(
      <WeatherDaySlot
        day={{ date: '2026-07-07', maxTemp: 30, minTemp: 19, weatherCode: 2 }}
        index={1}
      />,
    )

    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
  })
})
