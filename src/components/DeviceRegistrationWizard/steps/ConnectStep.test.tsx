import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/render'
import ConnectStep from './ConnectStep'

vi.mock('@/assets/wifi-portal-home.png', () => ({ default: 'wifi-portal-home.png' }))
vi.mock('@/assets/wifi-portal-configure.png', () => ({ default: 'wifi-portal-configure.png' }))

describe('ConnectStep', () => {
  it('renders hotspot connection instructions', () => {
    renderWithProviders(<ConnectStep />)

    expect(screen.getByText('Connect to device hotspot')).toBeInTheDocument()
    expect(screen.getAllByText(/Plantir-Device-Setup/i).length).toBeGreaterThan(0)
    expect(screen.getByAltText('WiFi portal home screen')).toBeInTheDocument()
    expect(screen.getByAltText('WiFi portal configure screen')).toBeInTheDocument()
  })
})
