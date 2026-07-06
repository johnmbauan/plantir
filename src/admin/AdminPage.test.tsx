import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import AdminPage from './AdminPage'

const refresh = vi.fn()

vi.mock('@/admin/hooks/useAdminDevices', () => ({
  useAdminDevices: vi.fn(),
}))

vi.mock('@/admin/components/DevicesTab', () => ({
  DevicesTab: ({ loading }: { loading: boolean }) => (
    <div>{loading ? 'Loading devices…' : 'Admin devices tab'}</div>
  ),
}))

vi.mock('@/admin/components/LogsTab', () => ({
  LogsTab: () => <div>Admin logs tab</div>,
}))

import { useAdminDevices } from '@/admin/hooks/useAdminDevices'

const mockedUseAdminDevices = vi.mocked(useAdminDevices)

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAdminDevices.mockReturnValue({
      devices: [{
        id: 1,
        serialNumber: 'SN-001',
        type: 'humidity',
        user_id: 'user-1',
        owner_email: 'a@example.com',
        plantName: 'Monstera',
        lastHumidity: null,
        lastBattery: null,
        lastSeenAt: null,
      }],
      loading: false,
      refresh,
    })
  })

  it('renders admin portal with devices tab', () => {
    renderWithProviders(<AdminPage />)

    expect(screen.getByRole('heading', { name: 'Admin Portal' })).toBeInTheDocument()
    expect(screen.getByText('Admin devices tab')).toBeInTheDocument()
  })

  it('switches to logs tab', async () => {
    const user = userEvent.setup()

    renderWithProviders(<AdminPage />)

    await user.click(screen.getByRole('tab', { name: 'Logs' }))

    expect(screen.getByText('Admin logs tab')).toBeInTheDocument()
  })

  it('shows loading state from hook', () => {
    mockedUseAdminDevices.mockReturnValue({
      devices: [],
      loading: true,
      refresh,
    })

    renderWithProviders(<AdminPage />)

    expect(screen.getByText('Loading devices…')).toBeInTheDocument()
  })
})
