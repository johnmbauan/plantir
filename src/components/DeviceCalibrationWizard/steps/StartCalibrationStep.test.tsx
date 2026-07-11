import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import StartCalibrationStep from './StartCalibrationStep';

describe('StartCalibrationStep', () => {
  it('renders start button before calibration begins', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    renderWithProviders(
      <StartCalibrationStep started={false} loading={false} onStart={onStart} />,
    );

    await user.click(screen.getByRole('button', { name: 'Start calibration' }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows waiting state after calibration starts', () => {
    renderWithProviders(
      <StartCalibrationStep started loading={false} onStart={vi.fn()} />,
    );

    expect(screen.getByText(/Waiting for the device to connect/i)).toBeInTheDocument();
  });
});
