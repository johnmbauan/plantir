import { describe, it, expect } from 'vitest'
import { Table } from '@mantine/core'
import { renderWithProviders, screen } from '@/test/render'
import { AdminLogRow } from '@/admin/components/AdminLogRow'
import type { AdminLog } from '@/admin/adminService'

const log = (overrides: Partial<AdminLog> = {}): AdminLog => ({
  id: 1,
  serialNumber: 'SN-001',
  level: 'info',
  message: 'Device connected',
  createdAt: '2026-07-06T08:00:00Z',
  ...overrides,
})

function renderRow(rowLog: AdminLog) {
  renderWithProviders(
    <Table>
      <Table.Tbody>
        <AdminLogRow log={rowLog} />
      </Table.Tbody>
    </Table>,
  )
}

describe('AdminLogRow', () => {
  it('renders log fields', () => {
    renderRow(log())

    expect(screen.getByRole('cell', { name: 'SN-001' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'info' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Device connected' })).toBeInTheDocument()
    expect(
      screen.getByRole('cell', { name: new Date('2026-07-06T08:00:00Z').toLocaleString() }),
    ).toBeInTheDocument()
  })

  it('renders unknown log level with fallback color', () => {
    renderRow(log({ level: 'debug' as 'info' }))

    expect(screen.getByRole('cell', { name: 'debug' })).toBeInTheDocument()
  })
})
