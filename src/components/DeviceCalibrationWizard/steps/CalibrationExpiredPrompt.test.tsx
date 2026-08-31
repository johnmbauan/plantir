import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import CalibrationExpiredPrompt from './CalibrationExpiredPrompt';

describe('CalibrationExpiredPrompt', () => {
  it('shows expired message and restart action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(<CalibrationExpiredPrompt onRetry={onRetry} />);

    expect(
      screen.getByText(
        "The sensor's calibration window has ended after 2 minutes. Restart calibration to try again.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restart calibration' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
