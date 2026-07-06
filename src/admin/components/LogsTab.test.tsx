import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import { LogsTab } from '@/admin/components/LogsTab'
import type { AdminDevice } from '@/admin/adminService'
import type { AdminLog } from '@/admin/adminService'

const mockRefresh = vi.fn()
const mockUseAdminLogs = vi.fn()

vi.mock('@/admin/hooks/useAdminLogs', () => ({
  useAdminLogs: (...args: unknown[]) => mockUseAdminLogs(...args),
}))

const devices: AdminDevice[] = [
  {
    id: 1,
    serialNumber: 'SN-001',
    type: 'humidity',
    user_id: 'user-1',
    owner_email: 'owner@example.com',
    plantName: 'Monstera',
    lastHumidity: 55,
    lastBattery: 80,
    lastSeenAt: '2026-07-06T08:00:00Z',
  },
]

const logs: AdminLog[] = [
  {
    id: 1,
    serialNumber: 'SN-001',
    level: 'info',
    message: 'Device connected',
    createdAt: '2026-07-06T08:00:00Z',
  },
]

describe('Admin LogsTab', () => {
  beforeEach(() => {
    mockUseAdminLogs.mockReturnValue({
      logs,
      loading: false,
      refresh: mockRefresh,
    })
  })

  it('renders log entries', () => {
    renderWithProviders(<LogsTab devices={devices} />)

    expect(screen.getByText('Device Logs')).toBeInTheDocument()
    expect(screen.getByText('Device connected')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'SN-001' })).toBeInTheDocument()
  })

  it('shows empty state when there are no logs', () => {
    mockUseAdminLogs.mockReturnValue({
      logs: [],
      loading: false,
      refresh: mockRefresh,
    })

    renderWithProviders(<LogsTab devices={devices} />)

    expect(screen.getByText('No logs found.')).toBeInTheDocument()
  })

  it('calls refresh when refresh button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LogsTab devices={devices} />)

    await user.click(screen.getByRole('button', { name: 'Refresh logs' }))
    expect(mockRefresh).toHaveBeenCalledOnce()
  })

  it('shows loading skeletons', () => {
    mockUseAdminLogs.mockReturnValue({
      logs: [],
      loading: true,
      refresh: mockRefresh,
    })

    renderWithProviders(<LogsTab devices={devices} />)

    expect(screen.queryByText('No logs found.')).not.toBeInTheDocument()
    expect(screen.queryByText('Device connected')).not.toBeInTheDocument()
  })

  it('filters logs by device serial', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LogsTab devices={devices} />)

    expect(mockUseAdminLogs).toHaveBeenCalledWith(null)

    await user.click(screen.getByRole('textbox'))
    // Mantine keeps combobox options in a hidden portal until layout completes in jsdom.
    // eslint-disable-next-line testing-library/no-node-access
    const option = document.querySelector('[data-combobox-option][value="SN-001"]')
    expect(option).toBeTruthy()
    await user.click(option!)

    expect(mockUseAdminLogs).toHaveBeenCalledWith('SN-001')
  })

  it('renders unknown log level with fallback color', () => {
    mockUseAdminLogs.mockReturnValue({
      logs: [{ ...logs[0], level: 'debug' as 'info' }],
      loading: false,
      refresh: mockRefresh,
    })

    renderWithProviders(<LogsTab devices={devices} />)

    expect(screen.getByText('debug')).toBeInTheDocument()
  })
})
