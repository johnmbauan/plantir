import { describe, it, expect } from 'vitest'
import { Table } from '@mantine/core'
import { renderWithProviders, screen } from '@/test/render'
import { AdminDeviceRow } from '@/admin/components/AdminDeviceRow'
import type { AdminDevice } from '@/admin/adminService'

const device = (overrides: Partial<AdminDevice> = {}): AdminDevice => ({
  id: 1,
  serialNumber: 'SN-001',
  type: 'humidity',
  user_id: 'user-1',
  owner_email: 'alice@example.com',
  plantName: 'Monstera',
  lastHumidity: 55,
  lastBattery: 80,
  lastSeenAt: '2026-07-06T08:00:00Z',
  ...overrides,
})

function renderRow(rowDevice: AdminDevice) {
  renderWithProviders(
    <Table>
      <Table.Tbody>
        <AdminDeviceRow device={rowDevice} />
      </Table.Tbody>
    </Table>,
  )
}

describe('AdminDeviceRow', () => {
  it('renders device fields', () => {
    renderRow(device())

    expect(screen.getByRole('cell', { name: 'SN-001' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'alice@example.com' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Monstera' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'humidity' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '55%' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '80%' })).toBeInTheDocument()
  })

  it('renders placeholders for missing values', () => {
    renderRow(device({
      owner_email: null,
      plantName: null,
      lastHumidity: null,
      lastBattery: null,
      lastSeenAt: null,
    }))

    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
