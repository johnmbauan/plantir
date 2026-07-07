import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '@/test/render'
import { buildDevice } from '@/test/builders/device'
import DeviceFormModal from './index'

const createDevice = vi.fn()
const updateDevice = vi.fn()

vi.mock('@/services/deviceService', () => ({
  createDevice: (...args: unknown[]) => createDevice(...args),
  updateDevice: (...args: unknown[]) => updateDevice(...args),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

function getDialog() {
  return screen.getByRole('dialog')
}

describe('DeviceFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createDevice.mockResolvedValue({ id: 99 })
    updateDevice.mockResolvedValue(undefined)
  })

  it('renders add device form in create mode', () => {
    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={null}
        plantOptions={[{ value: '1', label: 'Monstera' }]}
        onSaved={vi.fn()}
      />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByText(/Register new device/i)).toBeInTheDocument()
    expect(within(dialog).getByText('Assignment')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Add device' })).toBeInTheDocument()
  })

  it('renders edit device title with serial number', () => {
    const device = buildDevice({ serialNumber: 'SN-EDIT' })

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={device}
        plantOptions={[]}
        onSaved={vi.fn()}
      />,
    )

    const dialog = getDialog()
    expect(within(dialog).getByText('Edit device')).toBeInTheDocument()
    expect(within(dialog).getByText('SN-EDIT')).toBeInTheDocument()
    expect(within(dialog).getByText('Calibration')).toBeInTheDocument()
  })

  it('renders success state after device creation', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={null}
        plantOptions={[]}
        onSaved={vi.fn()}
        onOpenCalibration={vi.fn()}
      />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. SN-001'), 'SN-NEW')
    await user.click(within(dialog).getByRole('button', { name: 'Add device' }))

    expect(await within(dialog).findByRole('button', { name: 'Calibrate now' })).toBeInTheDocument()
  })

  it('updates serial number through assignment section', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={null}
        plantOptions={[{ value: '10', label: 'Monstera' }]}
        onSaved={vi.fn()}
      />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. SN-001'), 'SN-CALLBACK')
    await user.click(within(dialog).getByRole('button', { name: 'Add device' }))

    expect(createDevice).toHaveBeenCalledWith(
      expect.objectContaining({ serialNumber: 'SN-CALLBACK' }),
    )
  })

  it('updates plant assignment through select', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={null}
        plantOptions={[
          { value: '10', label: 'Monstera' },
          { value: '20', label: 'Ficus' },
        ]}
        onSaved={vi.fn()}
      />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. SN-001'), 'SN-PLANT')
    await user.click(within(dialog).getByRole('textbox', { name: 'Plant' }))
    await user.click(await screen.findByText('Ficus'))
    await user.click(within(dialog).getByRole('button', { name: 'Add device' }))

    expect(createDevice).toHaveBeenCalledWith(
      expect.objectContaining({ serialNumber: 'SN-PLANT', plantId: 20 }),
    )
  })

  it('prefills threshold from selected plant recommendation', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={null}
        plantOptions={[
          { value: '10', label: 'Monstera', recommendedThreshold: 42 },
        ]}
        onSaved={vi.fn()}
      />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. SN-001'), 'SN-RECO')
    await user.click(within(dialog).getByRole('textbox', { name: 'Plant' }))
    await user.click(await screen.findByText('Monstera'))
    await user.click(within(dialog).getByRole('button', { name: 'Add device' }))

    expect(createDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        serialNumber: 'SN-RECO',
        plantId: 10,
        humidityConfig: expect.objectContaining({ minHumidityThreshold: 42 }),
      }),
    )
  })

  it('updates humidity threshold through slider', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={null}
        plantOptions={[]}
        onSaved={vi.fn()}
      />,
    )

    const dialog = getDialog()
    await user.type(within(dialog).getByPlaceholderText('e.g. SN-001'), 'SN-THRESH')

    const slider = within(dialog).getByRole('slider')
    await user.click(slider)
    slider.focus()
    await user.keyboard('{ArrowRight>5}')

    await user.click(within(dialog).getByRole('button', { name: 'Add device' }))

    expect(createDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        serialNumber: 'SN-THRESH',
        humidityConfig: expect.objectContaining({
          minHumidityThreshold: expect.any(Number),
        }),
      }),
    )
  })

  it('saves edits via updateDevice', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const onClose = vi.fn()
    const device = buildDevice({ id: 7, serialNumber: 'SN-EDIT' })

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={onClose}
        editingDevice={device}
        plantOptions={[]}
        onSaved={onSaved}
      />,
    )

    const dialog = getDialog()
    const slider = within(dialog).getByRole('slider')
    await user.click(slider)
    slider.focus()
    await user.keyboard('{ArrowRight>3}')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(updateDevice).toHaveBeenCalledWith(7, expect.any(Object))
    expect(onClose).toHaveBeenCalled()
    expect(onSaved).toHaveBeenCalled()
  })

  it('shows suggested threshold text in edit mode when recommendation exists', () => {
    const device = buildDevice({ id: 7, serialNumber: 'SN-EDIT', plantId: 10 })

    renderWithProviders(
      <DeviceFormModal
        opened
        onClose={vi.fn()}
        editingDevice={device}
        plantOptions={[{ value: '10', label: 'Monstera', recommendedThreshold: 15 }]}
        onSaved={vi.fn()}
      />,
    )

    expect(within(getDialog()).getByText('Suggested from species: 15%')).toBeInTheDocument()
  })
})
