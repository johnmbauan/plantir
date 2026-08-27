import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import WakeDeviceStep from './WakeDeviceStep';

const WAKE_INSTRUCTION =
  'Slightly twist the cap counter-clockwise, then pull it up. Press the Restart button on your Plantir device to wake it up. After you press it, the chip inside the Plantir device will light a green LED three times in a row. Then put the cap back on.';

describe('WakeDeviceStep', () => {
  it('shows waiting state while waiting for the device', () => {
    renderWithProviders(<WakeDeviceStep calibrationExpired={false} timedOut={false} onRetry={vi.fn()} />);

    expect(screen.getByText('Wake the device')).toBeInTheDocument();
    expect(screen.getByText('Restart').parentElement?.textContent).toBe(WAKE_INSTRUCTION);
    expect(screen.getByText('Waiting for the device to connect…')).toBeInTheDocument();
  });

  it('shows retry action when timed out', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<WakeDeviceStep calibrationExpired={false} timedOut onRetry={onRetry} />);

    expect(screen.getByText('Restart').parentElement?.textContent).toBe(WAKE_INSTRUCTION);
    expect(
      screen.getByText(
        'No reading received. Make sure you pressed the restart button and the device connected to Wi-Fi.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows expired prompt when calibration window ended', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<WakeDeviceStep calibrationExpired timedOut={false} onRetry={onRetry} />);

    expect(
      screen.getByText("The device's calibration window has ended after 2 minutes. Restart calibration to try again."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restart calibration' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
