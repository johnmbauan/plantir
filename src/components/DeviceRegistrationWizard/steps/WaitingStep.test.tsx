import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import WaitingStep from './WaitingStep';

describe('WaitingStep', () => {
  it('shows loading state while waiting', () => {
    renderWithProviders(
      <WaitingStep
        timedOut={false}
        error={null}
        onKeepWaiting={vi.fn()}
        onRegenerateCode={vi.fn()}
      />,
    );

    expect(screen.getByText('Waiting for registration')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for the sensor to register/i)).toBeInTheDocument();
  });

  it('shows timeout actions when timed out', async () => {
    const user = userEvent.setup();
    const onKeepWaiting = vi.fn();
    const onRegenerateCode = vi.fn();

    renderWithProviders(
      <WaitingStep
        timedOut
        error={null}
        onKeepWaiting={onKeepWaiting}
        onRegenerateCode={onRegenerateCode}
      />,
    );

    expect(screen.getByText('Still waiting')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep waiting' }));
    await user.click(screen.getByRole('button', { name: 'Generate a new setup code' }));

    expect(onKeepWaiting).toHaveBeenCalledTimes(1);
    expect(onRegenerateCode).toHaveBeenCalledTimes(1);
  });

  it('shows error alert when registration fails', () => {
    renderWithProviders(
      <WaitingStep
        timedOut={false}
        error="Registration failed. Please try again or contact support."
        onKeepWaiting={vi.fn()}
        onRegenerateCode={vi.fn()}
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
  });
});
