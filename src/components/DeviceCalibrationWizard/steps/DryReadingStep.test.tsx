import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import DryReadingStep from './DryReadingStep';

describe('DryReadingStep', () => {
  it('shows waiting state when no reading is available', () => {
    renderWithProviders(
      <DryReadingStep
        calibrationExpired={false}
        timedOut={false}
        readingRejected={false}
        countdownKey={0}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Dry reading')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for a reading/i)).toBeInTheDocument();
  });

  it('shows placement hint when reading is rejected', () => {
    renderWithProviders(
      <DryReadingStep
        calibrationExpired={false}
        timedOut={false}
        readingRejected
        countdownKey={1}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/then hold still/i)).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for a reading/i)).not.toBeInTheDocument();
  });

  it('shows retry action when timed out', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <DryReadingStep
        calibrationExpired={false}
        timedOut
        readingRejected={false}
        countdownKey={0}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
