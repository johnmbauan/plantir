import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import WetReadingStep from './WetReadingStep';

vi.mock('@/assets/sensor-submerge-guide.png', () => ({ default: 'sensor-submerge-guide.png' }));

describe('WetReadingStep', () => {
  it('shows waiting state when no reading is available', () => {
    renderWithProviders(
      <WetReadingStep
        calibrationExpired={false}
        timedOut={false}
        readingRejected={false}
        countdownKey={0}
        saving={false}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Wet reading')).toBeInTheDocument();
    expect(screen.getByText(/white horizontal line/i)).toBeInTheDocument();
    expect(screen.getByAltText(/white horizontal line/i)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for a reading/i)).toBeInTheDocument();
  });

  it('shows placement hint when reading is rejected', () => {
    renderWithProviders(
      <WetReadingStep
        calibrationExpired={false}
        timedOut={false}
        readingRejected
        countdownKey={1}
        saving={false}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/submerged in water down to the white horizontal line/i)).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for a reading/i)).not.toBeInTheDocument();
  });

  it('shows saving state while calibration is being saved', () => {
    renderWithProviders(
      <WetReadingStep
        calibrationExpired={false}
        timedOut={false}
        readingRejected={false}
        countdownKey={0}
        saving
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/Saving calibration/i)).toBeInTheDocument();
  });

  it('shows restart action when timed out', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <WetReadingStep
        calibrationExpired={false}
        timedOut
        readingRejected={false}
        countdownKey={0}
        saving={false}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Restart calibration' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows expired prompt when calibration window ended', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <WetReadingStep
        calibrationExpired
        timedOut={false}
        readingRejected={false}
        countdownKey={0}
        saving={false}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText(/calibration window has ended after 2 minutes/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restart calibration' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
