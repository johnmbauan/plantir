import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import WetReadingStep from './WetReadingStep';

const pendingReading = {
  id: 2,
  deviceId: 1,
  rawValue: 320,
  createdAt: '2026-07-06T12:01:00Z',
};

describe('WetReadingStep', () => {
  it('shows waiting state when no reading is available', () => {
    renderWithProviders(
      <WetReadingStep
        pendingReading={null}
        dryValue={512}
        timedOut={false}
        saving={false}
        onAccept={vi.fn()}
        onSkip={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Wet reading')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for a reading/i)).toBeInTheDocument();
  });

  it('shows dry and wet readings with accept action', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    renderWithProviders(
      <WetReadingStep
        pendingReading={pendingReading}
        dryValue={512}
        timedOut={false}
        saving={false}
        onAccept={onAccept}
        onSkip={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('512')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use this reading' }));

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('shows restart action when timed out', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    renderWithProviders(
      <WetReadingStep
        pendingReading={null}
        dryValue={512}
        timedOut
        saving={false}
        onAccept={vi.fn()}
        onSkip={vi.fn()}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Restart calibration' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
