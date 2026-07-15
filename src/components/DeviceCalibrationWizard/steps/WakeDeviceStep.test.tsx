import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import WakeDeviceStep from './WakeDeviceStep';

describe('WakeDeviceStep', () => {
  it('shows waiting state while waiting for the device', () => {
    renderWithProviders(<WakeDeviceStep calibrationExpired={false} timedOut={false} onRetry={vi.fn()} />);

    expect(screen.getByText('Wake the device')).toBeInTheDocument();
    expect(screen.getByText(/Press the/i)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for the device to connect/i)).toBeInTheDocument();
  });

  it('shows retry action when timed out', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<WakeDeviceStep calibrationExpired={false} timedOut onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows expired prompt when calibration window ended', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<WakeDeviceStep calibrationExpired timedOut={false} onRetry={onRetry} />);

    expect(screen.getByText(/calibration window has ended after 2 minutes/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restart calibration' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
