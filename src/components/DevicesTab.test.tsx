import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { buildDevice } from '@/test/builders/device'
import { buildPlant } from '@/test/builders/plant'
import DevicesTab from '@/components/DevicesTab'

vi.mock('@/services/deviceService', () => ({
  fetchDevices: vi.fn(),
}))

vi.mock('@/services/plantService', () => ({
  fetchPlants: vi.fn(),
}))

const DeviceFormModalMock = vi.fn<(props: unknown) => null>(() => null)
const DeviceDeleteModalMock = vi.fn<(props: unknown) => null>(() => null)
const DeviceRegistrationWizardMock = vi.fn<(props: unknown) => null>(() => null)
const DeviceCalibrationWizardMock = vi.fn<(props: unknown) => null>(() => null)

vi.mock('@/components/DeviceFormModal', () => ({
  default: (props: unknown) => DeviceFormModalMock(props),
}))

vi.mock('@/components/DeviceDeleteModal', () => ({
  default: (props: unknown) => DeviceDeleteModalMock(props),
}))

vi.mock('@/components/DeviceRegistrationWizard', () => ({
  default: (props: unknown) => DeviceRegistrationWizardMock(props),
}))

vi.mock('@/components/DeviceCalibrationWizard', () => ({
  default: (props: unknown) => DeviceCalibrationWizardMock(props),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

import { fetchDevices } from '@/services/deviceService'
import { fetchPlants } from '@/services/plantService'

describe('DevicesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchDevices).mockResolvedValue([buildDevice()])
    vi.mocked(fetchPlants).mockResolvedValue([buildPlant()])
  })

  it('renders loaded devices', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)

    expect(await screen.findByText('SN-001')).toBeInTheDocument()
    expect(screen.getByText('Monstera')).toBeInTheDocument()
  })

  it('shows empty state when there are no devices', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([])
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)

    expect(await screen.findByText('No devices yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register your first device' })).toBeInTheDocument()
  })

  it('filters devices by search query', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice(),
      buildDevice({ id: 2, serialNumber: 'SN-002', plantName: 'Fern' }),
    ])

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.type(screen.getByPlaceholderText('Search by serial number or plant…'), 'fern')

    expect(screen.queryByText('SN-001')).not.toBeInTheDocument()
    expect(screen.getByText('SN-002')).toBeInTheDocument()
  })

  it('shows no search results message when filter matches nothing', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchDevices).mockResolvedValue([buildDevice()])

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.type(screen.getByPlaceholderText('Search by serial number or plant…'), 'nomatch')

    expect(screen.getByText('No devices match your search.')).toBeInTheDocument()
  })

  it('shows error notification when loading fails', async () => {
    const { notifications } = await import('@mantine/notifications')
    vi.mocked(fetchDevices).mockRejectedValue(new Error('Load failed'))

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Load failed' }),
      )
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()
    const device = buildDevice()

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.click(screen.getByRole('button', { name: 'Edit device' }))

    expect(DeviceFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingDevice: device }),
    )
  })

  it('opens delete modal when delete button is clicked', async () => {
    const user = userEvent.setup()
    const device = buildDevice()

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.click(screen.getByRole('button', { name: 'Delete device' }))

    expect(DeviceDeleteModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, device }),
    )
  })

  it('opens calibration wizard when calibrate button is clicked', async () => {
    const user = userEvent.setup()
    const device = buildDevice()

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.click(screen.getByRole('button', { name: 'Calibrate sensor' }))

    expect(DeviceCalibrationWizardMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, deviceId: device.id }),
    )
  })

  it('opens edit modal from deviceId URL param', async () => {
    const device = buildDevice({ id: 5 })

    vi.mocked(fetchDevices).mockResolvedValue([device])

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />, {
      route: '/?deviceId=5',
    })

    await waitFor(() => {
      expect(DeviceFormModalMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true, editingDevice: device }),
      )
    })
  })

  it('opens add device modal from Add manually button', async () => {
    const user = userEvent.setup()

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.click(screen.getByRole('button', { name: 'Add manually' }))

    expect(DeviceFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingDevice: null }),
    )
  })

  it('opens registration wizard from header button', async () => {
    const user = userEvent.setup()

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />)
    await screen.findByText('SN-001')

    await user.click(screen.getByRole('button', { name: 'Register new device' }))

    expect(DeviceRegistrationWizardMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true }),
    )
  })

  it('opens registration wizard from register=1 URL param', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />, {
      route: '/?register=1',
    })

    await waitFor(() => {
      expect(DeviceRegistrationWizardMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true }),
      )
    })
  })
})
