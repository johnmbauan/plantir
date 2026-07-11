import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within, waitFor } from '@/test/render';
import { notifications } from '@mantine/notifications';
import DeviceCalibrationWizard from './index';

const startCalibrationMode = vi.fn();
const clearCalibrationMode = vi.fn();
const getLatestCalibrationReading = vi.fn();
const saveCalibrationValues = vi.fn();
const onClose = vi.fn();
const onCalibrated = vi.fn();

vi.mock('@/services/deviceService', () => ({
  startCalibrationMode: (...args: unknown[]) => startCalibrationMode(...args),
  clearCalibrationMode: (...args: unknown[]) => clearCalibrationMode(...args),
  getLatestCalibrationReading: (...args: unknown[]) => getLatestCalibrationReading(...args),
  saveCalibrationValues: (...args: unknown[]) => saveCalibrationValues(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const dryReading = {
  id: 1,
  deviceId: 1,
  rawValue: 512,
  createdAt: '2026-07-06T12:00:00Z',
};

const wetReading = {
  id: 2,
  deviceId: 1,
  rawValue: 320,
  createdAt: '2026-07-06T12:01:00Z',
};

function getDialog() {
  return screen.getByRole('dialog');
}

async function advanceToStartStep(user: ReturnType<typeof userEvent.setup>) {
  const dialog = getDialog();
  await user.click(within(dialog).getByRole('button', { name: 'Next' }));
  await user.click(within(dialog).getByRole('button', { name: 'Next' }));
}

async function startCalibration(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(getDialog()).getByRole('button', { name: 'Start calibration' }));
  await waitFor(() => expect(startCalibrationMode).toHaveBeenCalledWith(1));
}

describe('DeviceCalibrationWizard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    startCalibrationMode.mockResolvedValue(undefined);
    clearCalibrationMode.mockResolvedValue(undefined);
    getLatestCalibrationReading.mockResolvedValue(null);
    saveCalibrationValues.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders prepare step when opened', () => {
    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    const dialog = getDialog();
    expect(within(dialog).getByText('Before you start')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked on first step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(clearCalibrationMode).not.toHaveBeenCalled();
  });

  it('advances to open device step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    const dialog = getDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    expect(within(dialog).getByText('Open the device')).toBeInTheDocument();
  });

  it('disables Next on start step until calibration has started', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await advanceToStartStep(user);

    const dialog = getDialog();
    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeDisabled();

    await startCalibration(user);

    expect(within(dialog).getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('shows error notification when startCalibrationMode fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    startCalibrationMode.mockRejectedValue(new Error('Device offline'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await advanceToStartStep(user);
    await startCalibration(user);

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'red', message: 'Device offline' }),
    );
  });

  it('does not start calibration when deviceId is null', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={null} />,
    );

    await advanceToStartStep(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Start calibration' }));

    expect(startCalibrationMode).not.toHaveBeenCalled();
  });

  it('auto-advances to dry reading when first reading arrives', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await advanceToStartStep(user);
    await startCalibration(user);

    getLatestCalibrationReading.mockResolvedValue(dryReading);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByText(/Waiting for a reading/i)).toBeInTheDocument();
    });
  });

  async function reachDryReadingWithValue(user: ReturnType<typeof userEvent.setup>) {
    await advanceToStartStep(user);
    await startCalibration(user);
    getLatestCalibrationReading.mockResolvedValue(dryReading);
    await vi.advanceTimersByTimeAsync(2000); // auto-advance to dry step
    await vi.advanceTimersByTimeAsync(2000); // poll reading onto dry step
    await waitFor(() => expect(within(getDialog()).getByText('512')).toBeInTheDocument());
  }

  it('completes full calibration flow', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} onCalibrated={onCalibrated} />,
    );

    await reachDryReadingWithValue(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Use this reading' }));

    getLatestCalibrationReading.mockResolvedValue(wetReading);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => expect(within(getDialog()).getByText('320')).toBeInTheDocument());
    await user.click(within(getDialog()).getByRole('button', { name: 'Use this reading' }));

    await waitFor(() => {
      expect(saveCalibrationValues).toHaveBeenCalledWith(1, 512, 320);
      expect(onCalibrated).toHaveBeenCalled();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when saving calibration fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    saveCalibrationValues.mockRejectedValue(new Error('Save failed'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachDryReadingWithValue(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Use this reading' }));

    getLatestCalibrationReading.mockResolvedValue(wetReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(within(getDialog()).getByText('320')).toBeInTheDocument());
    await user.click(within(getDialog()).getByRole('button', { name: 'Use this reading' }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error saving calibration', message: 'Save failed' }),
      );
    });
  });

  it('skips dry reading and waits for next one', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachDryReadingWithValue(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Wait for the next one' }));

    expect(within(getDialog()).queryByText('512')).not.toBeInTheDocument();
  });

  it('retries dry reading after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await advanceToStartStep(user);
    await startCalibration(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Next' }));

    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Try again' }));

    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeInTheDocument();
  }, 15000);

  async function reachWetReadingWithValue(user: ReturnType<typeof userEvent.setup>) {
    await reachDryReadingWithValue(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Use this reading' }));
    getLatestCalibrationReading.mockResolvedValue(wetReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(within(getDialog()).getByText('320')).toBeInTheDocument());
  }

  it('retries wet reading after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachWetReadingWithValue(user);

    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Restart calibration' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Restart calibration' }));

    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeInTheDocument();
  });

  it('skips wet reading and waits for next one', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachWetReadingWithValue(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Wait for the next one' }));

    expect(within(getDialog()).queryByText('320')).not.toBeInTheDocument();
  }, 15000);

  it('clears calibration mode when closing mid-flow', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await advanceToStartStep(user);
    await startCalibration(user);

    // Mantine modal close button is not exposed in the accessibility tree.
    // eslint-disable-next-line testing-library/no-node-access
    const closeButton = document.querySelector('.mantine-Modal-close');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton!);

    expect(clearCalibrationMode).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('logs poll errors without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    getLatestCalibrationReading.mockRejectedValue(new Error('Poll failed'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await advanceToStartStep(user);
    await startCalibration(user);

    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Calibration poll error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
