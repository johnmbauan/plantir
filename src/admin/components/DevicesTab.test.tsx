import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import { DevicesTab } from '@/admin/components/DevicesTab'
import type { AdminDevice } from '@/admin/adminService'

const sampleDevice: AdminDevice = {
  id: 1,
  serialNumber: 'SN-001',
  type: 'humidity',
  user_id: 'user-1',
  owner_email: 'owner@example.com',
  plantName: 'Monstera',
  lastHumidity: 55,
  lastBattery: 80,
  lastSeenAt: '2026-07-06T08:00:00Z',
}

describe('Admin DevicesTab', () => {
  it('renders device rows', () => {
    renderWithProviders(
      <DevicesTab devices={[sampleDevice]} loading={false} onRefresh={vi.fn()} />,
    )

    expect(screen.getByText('All Devices')).toBeInTheDocument()
    expect(screen.getByText('SN-001')).toBeInTheDocument()
    expect(screen.getByText('owner@example.com')).toBeInTheDocument()
    expect(screen.getByText('Monstera')).toBeInTheDocument()
  })

  it('filters devices by search query', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DevicesTab
        devices={[
          sampleDevice,
          { ...sampleDevice, id: 2, serialNumber: 'SN-002', plantName: 'Fern' },
        ]}
        loading={false}
        onRefresh={vi.fn()}
      />,
    )

    await user.type(
      screen.getByPlaceholderText('Filter by serial, owner or plant…'),
      'fern',
    )

    expect(screen.queryByText('SN-001')).not.toBeInTheDocument()
    expect(screen.getByText('SN-002')).toBeInTheDocument()
  })

  it('shows empty state when no devices exist', () => {
    renderWithProviders(
      <DevicesTab devices={[]} loading={false} onRefresh={vi.fn()} />,
    )

    expect(screen.getByText('No devices registered.')).toBeInTheDocument()
  })

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()

    renderWithProviders(
      <DevicesTab devices={[]} loading={false} onRefresh={onRefresh} />,
    )

    await user.click(screen.getByRole('button', { name: 'Refresh devices' }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('shows loading skeletons', () => {
    renderWithProviders(
      <DevicesTab devices={[sampleDevice]} loading onRefresh={vi.fn()} />,
    )

    expect(screen.queryByText('SN-001')).not.toBeInTheDocument()
  })

  it('shows no filter match message when search excludes all devices', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DevicesTab devices={[sampleDevice]} loading={false} onRefresh={vi.fn()} />,
    )

    await user.type(
      screen.getByPlaceholderText('Filter by serial, owner or plant…'),
      'nomatch',
    )

    expect(screen.getByText('No devices match your filter.')).toBeInTheDocument()
  })

  it('renders placeholders for missing owner and readings', () => {
    renderWithProviders(
      <DevicesTab
        devices={[{
          ...sampleDevice,
          owner_email: null,
          plantName: null,
          lastHumidity: null,
          lastBattery: null,
          lastSeenAt: null,
        }]}
        loading={false}
        onRefresh={vi.fn()}
      />,
    )

    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
