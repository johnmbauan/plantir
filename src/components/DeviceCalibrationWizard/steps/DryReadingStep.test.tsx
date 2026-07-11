import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import DryReadingStep from './DryReadingStep';

const pendingReading = {
  id: 1,
  deviceId: 1,
  rawValue: 512,
  createdAt: '2026-07-06T12:00:00Z',
};

describe('DryReadingStep', () => {
  it('shows waiting state when no reading is available', () => {
    renderWithProviders(
      <DryReadingStep
        pendingReading={null}
        timedOut={false}
        onAccept={vi.fn()}
        onSkip={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Dry reading')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for a reading/i)).toBeInTheDocument();
  });

  it('shows reading and accept actions when data arrives', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    renderWithProviders(
      <DryReadingStep
        pendingReading={pendingReading}
        timedOut={false}
        onAccept={onAccept}
        onSkip={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('512')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use this reading' }));

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('shows retry action when timed out', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <DryReadingStep
        pendingReading={null}
        timedOut
        onAccept={vi.fn()}
        onSkip={vi.fn()}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
