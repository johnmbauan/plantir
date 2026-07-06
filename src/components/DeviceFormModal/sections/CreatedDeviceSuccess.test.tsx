import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import CreatedDeviceSuccess from './CreatedDeviceSuccess'

describe('CreatedDeviceSuccess', () => {
  it('renders success message and done button', () => {
    renderWithProviders(
      <CreatedDeviceSuccess showCalibrate={false} onCalibrate={vi.fn()} onDone={vi.fn()} />,
    )

    expect(screen.getByText(/Calibrate the sensor for accurate readings/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Calibrate now' })).not.toBeInTheDocument()
  })

  it('shows calibrate button when enabled', async () => {
    const user = userEvent.setup()
    const onCalibrate = vi.fn()

    renderWithProviders(
      <CreatedDeviceSuccess showCalibrate onCalibrate={onCalibrate} onDone={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Calibrate now' }))

    expect(onCalibrate).toHaveBeenCalledTimes(1)
  })

  it('calls onDone when done is clicked', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()

    renderWithProviders(
      <CreatedDeviceSuccess showCalibrate={false} onCalibrate={vi.fn()} onDone={onDone} />,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
