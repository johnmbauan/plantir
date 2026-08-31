import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within, waitFor } from '@/test/render';
import { notifications } from '@mantine/notifications';
import DeviceRegistrationWizard from './index';

const createPairingBundle = vi.fn();
const pollPairingToken = vi.fn();
const onClose = vi.fn();
const onRegistered = vi.fn();
const onFinished = vi.fn();

vi.mock('@/services/deviceService', () => ({
  createPairingBundle: (...args: unknown[]) => createPairingBundle(...args),
  pollPairingToken: (...args: unknown[]) => pollPairingToken(...args),
}));

vi.mock('@/components/DeviceCalibrationWizard', () => ({
  default: ({ opened, onClose: onCalibrationClose }: { opened: boolean; onClose: () => void }) =>
    opened ? (
      <div role="dialog" aria-label="Calibration wizard">
        <button type="button" onClick={onCalibrationClose}>Close calibration</button>
      </div>
    ) : null,
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

function getDialog() {
  return screen.getByRole('dialog', { name: 'Register new sensor' });
}

async function advanceToSetupCode(user: ReturnType<typeof userEvent.setup>) {
  const dialog = getDialog();
  await user.click(within(dialog).getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(createPairingBundle).toHaveBeenCalled());
}

async function advanceToWaiting(user: ReturnType<typeof userEvent.setup>) {
  await advanceToSetupCode(user);
  const dialog = getDialog();
  await user.click(within(dialog).getByRole('button', { name: 'Next' }));
  await user.click(within(dialog).getByRole('button', { name: "I've connected the sensor" }));
}

describe('DeviceRegistrationWizard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    createPairingBundle.mockResolvedValue({
      tokenId: 'token-1',
      bundle: 'setup-code',
      expiresAt: '2026-07-06T14:00:00Z',
    });
    pollPairingToken.mockResolvedValue({ used: false, failed: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders first step when opened', () => {
    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[{ value: '1', label: 'Monstera' }]}
        onRegistered={onRegistered}
      />,
    );

    const dialog = getDialog();
    expect(within(dialog).getByText(/registering a Plantir humidity sensor/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked on first step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
        onFinished={onFinished}
      />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('advances from prepare to setup code step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    const dialog = getDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(within(dialog).getByText(/Copy this setup code/i)).toBeInTheDocument();
    });
  });

  it('shows error when createPairingBundle fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    createPairingBundle.mockRejectedValue(new Error('Bundle failed'));

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'red', message: 'Bundle failed' }),
      );
    });
  });

  it('disables Next on setup code step while pairing is loading', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let resolveBundle: (value: unknown) => void;
    createPairingBundle.mockImplementation(
      () => new Promise((resolve) => { resolveBundle = resolve; }),
    );

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Next' }));

    expect(within(getDialog()).getByRole('button', { name: 'Next' })).toBeDisabled();

    resolveBundle!({
      tokenId: 'token-1',
      bundle: 'setup-code',
      expiresAt: '2026-07-06T14:00:00Z',
    });

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Next' })).toBeEnabled();
    });
  });

  it('advances to completed step when pairing succeeds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({
      used: true,
      serialNumber: 'SN-NEW',
      deviceId: 42,
    });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(onRegistered).toHaveBeenCalled();
      expect(within(getDialog()).getByText('SN-NEW')).toBeInTheDocument();
    });
  });

  it('shows device-owned error when registration fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({
      used: false,
      failed: true,
      failureReason: 'device_owned_by_another_user',
    });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByText(/already registered to a different account/i)).toBeInTheDocument();
    });
  });

  it('shows generic error when registration fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({ used: false, failed: true });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  it('shows timeout on waiting step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Keep waiting' })).toBeInTheDocument();
    });
  });

  it('restarts polling when keep waiting is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Keep waiting' })).toBeInTheDocument();
    });

    pollPairingToken.mockClear();
    await user.click(within(getDialog()).getByRole('button', { name: 'Keep waiting' }));
    await vi.advanceTimersByTimeAsync(2000);

    expect(pollPairingToken).toHaveBeenCalled();
  });

  it('returns to setup code step when regenerating code', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Generate a new setup code' })).toBeInTheDocument();
    });

    createPairingBundle.mockClear();
    await user.click(within(getDialog()).getByRole('button', { name: 'Generate a new setup code' }));

    await waitFor(() => {
      expect(within(getDialog()).getByText(/Copy this setup code/i)).toBeInTheDocument();
      expect(createPairingBundle).toHaveBeenCalled();
    });
  });

  it('opens calibration wizard after registration completes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({
      used: true,
      serialNumber: 'SN-NEW',
      deviceId: 42,
    });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
        onFinished={onFinished}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Calibrate sensor' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Calibrate sensor' }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Calibration wizard' })).toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('skips calibration and closes on completed step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({
      used: true,
      serialNumber: 'SN-NEW',
      deviceId: 42,
    });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
        onFinished={onFinished}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Skip for now' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Skip for now' }));

    expect(onClose).toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('passes selected plant id when generating bundle', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[{ value: '7', label: 'Monstera' }]}
        onRegistered={onRegistered}
      />,
    );

    const dialog = getDialog();
    await user.click(screen.getByPlaceholderText('You can assign a plant now or later'));
    await user.click(await screen.findByText('Monstera'));
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(createPairingBundle).toHaveBeenCalledWith(7);
    });
  });

  it('shows poll error message when polling fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables calibrate button when device id is missing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({
      used: true,
      serialNumber: 'SN-NEW',
      deviceId: undefined,
    });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Calibrate sensor' })).toBeDisabled();
    });
  });

  it('closes nested calibration wizard', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    pollPairingToken.mockResolvedValue({
      used: true,
      serialNumber: 'SN-NEW',
      deviceId: 42,
    });

    renderWithProviders(
      <DeviceRegistrationWizard
        opened
        onClose={onClose}
        plantOptions={[]}
        onRegistered={onRegistered}
        onFinished={onFinished}
      />,
    );

    await advanceToWaiting(user);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Calibrate sensor' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Calibrate sensor' }));

    const calibrationDialog = screen.getByRole('dialog', { name: 'Calibration wizard' });
    expect(calibrationDialog).toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();

    await user.click(within(calibrationDialog).getByRole('button', { name: 'Close calibration' }));

    expect(screen.queryByRole('dialog', { name: 'Calibration wizard' })).not.toBeInTheDocument();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
