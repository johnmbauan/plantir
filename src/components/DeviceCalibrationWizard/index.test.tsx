import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within, waitFor } from '@/test/render';
import { notifications } from '@mantine/notifications';
import * as deviceService from '@/services/deviceService';
import DeviceCalibrationWizard from './index';

const onClose = vi.fn();
const onCalibrated = vi.fn();

const WAKE_INSTRUCTION =
  'Slightly twist the cap counter-clockwise, then pull it up. Press the Restart button on your Plantir sensor to wake it up. After you press it, the chip inside the Plantir sensor will light a green LED three times in a row. Then put the cap back on.';

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const connectivityReading = {
  id: 0,
  deviceId: 1,
  rawValue: 2000,
  createdAt: '2026-07-06T11:59:00Z',
};

const invalidDryReading = {
  id: 1,
  deviceId: 1,
  rawValue: 512,
  createdAt: '2026-07-06T12:00:00Z',
};

const validDryReading = {
  id: 2,
  deviceId: 1,
  rawValue: 2700,
  createdAt: '2026-07-06T12:00:10Z',
};

const invalidWetReading = {
  id: 3,
  deviceId: 1,
  rawValue: 320,
  createdAt: '2026-07-06T12:01:00Z',
};

const validWetReading = {
  id: 4,
  deviceId: 1,
  rawValue: 950,
  createdAt: '2026-07-06T12:01:10Z',
};

function getDialog() {
  return screen.getByRole('dialog');
}

function expectWakeInstructions(dialog: HTMLElement = getDialog()) {
  expect(within(dialog).getByText('Wake the sensor')).toBeInTheDocument();
  expect(within(dialog).getByText('Restart').parentElement?.textContent).toBe(WAKE_INSTRUCTION);
}

async function startCalibration(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(getDialog()).getByRole('button', { name: 'Start calibration' }));
  await waitFor(() => expect(deviceService.startCalibrationMode).toHaveBeenCalledWith(1));
  await waitFor(() => {
    expectWakeInstructions();
    expect(within(getDialog()).getByText('Waiting for the sensor to connect…')).toBeInTheDocument();
  });
}

async function reachDryReadingStep(user: ReturnType<typeof userEvent.setup>) {
  await startCalibration(user);
  vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(connectivityReading);
  await vi.advanceTimersByTimeAsync(2000);
  await waitFor(() => {
    expect(within(getDialog()).getByText(/black sensor tip/i)).toBeInTheDocument();
    expect(within(getDialog()).getByText(/Waiting for a reading/i)).toBeInTheDocument();
  });
}

describe('DeviceCalibrationWizard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-07-06T11:58:00Z'));
    vi.spyOn(deviceService, 'startCalibrationMode').mockResolvedValue(undefined);
    vi.spyOn(deviceService, 'clearCalibrationMode').mockResolvedValue(undefined);
    vi.spyOn(deviceService, 'getLatestCalibrationReading').mockResolvedValue(null);
    vi.spyOn(deviceService, 'saveCalibrationValues').mockResolvedValue(undefined);
    vi.spyOn(deviceService, 'isCalibrationModeActive').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders prepare step when opened', () => {
    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    const dialog = getDialog();
    expect(within(dialog).getByText('Before you start')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Start calibration' })).toBeInTheDocument();
    expect(within(dialog).queryByText('Wake the sensor')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Restart')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked on first step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(deviceService.clearCalibrationMode).not.toHaveBeenCalled();
  });

  it('starts calibration and advances to wake device step with restart instructions', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    const dialog = getDialog();
    await startCalibration(user);

    expectWakeInstructions(dialog);
    expect(within(dialog).queryByRole('button', { name: 'Start calibration' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('returns to prepare when Back is clicked on wake step', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);
    await user.click(within(getDialog()).getByRole('button', { name: 'Back' }));

    expect(within(getDialog()).getByText('Before you start')).toBeInTheDocument();
    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeInTheDocument();
    expect(within(getDialog()).queryByText('Wake the sensor')).not.toBeInTheDocument();
  });

  it('shows error notification when startCalibrationMode fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(deviceService.startCalibrationMode).mockRejectedValue(new Error('Device offline'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Start calibration' }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'red', message: 'Device offline' }),
      );
    });
    expect(within(getDialog()).getByText('Before you start')).toBeInTheDocument();
    expect(within(getDialog()).queryByText('Wake the sensor')).not.toBeInTheDocument();
  });

  it('does not start calibration when deviceId is null', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={null} />,
    );

    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeDisabled();
    await user.click(within(getDialog()).getByRole('button', { name: 'Start calibration' }));

    expect(deviceService.startCalibrationMode).not.toHaveBeenCalled();
  });

  it('shows expired prompt when device exits calibration mode', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);

    vi.mocked(deviceService.isCalibrationModeActive).mockResolvedValue(false);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(
        within(getDialog()).getByText(
          "The sensor's calibration window has ended after 2 minutes. Restart calibration to try again.",
        ),
      ).toBeInTheDocument();
    });
    expect(within(getDialog()).getByRole('button', { name: 'Restart calibration' })).toBeInTheDocument();
  });

  it('returns to prepare after restarting from expired prompt', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);

    vi.mocked(deviceService.isCalibrationModeActive).mockResolvedValue(false);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Restart calibration' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Restart calibration' }));

    expect(within(getDialog()).getByText('Before you start')).toBeInTheDocument();
    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeEnabled();
    expect(within(getDialog()).queryByText('Wake the sensor')).not.toBeInTheDocument();
  });

  it('auto-advances to dry reading when first reading arrives', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachDryReadingStep(user);
  });

  it('shows placement hint when dry reading is out of range', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachDryReadingStep(user);

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(invalidDryReading);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(within(getDialog()).getByText(/in open air, away from any soil or water, then hold still/i)).toBeInTheDocument();
    });
    expect(within(getDialog()).queryByText('512')).not.toBeInTheDocument();
  });

  it('completes full calibration flow automatically', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} onCalibrated={onCalibrated} />,
    );

    await reachDryReadingStep(user);

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(invalidDryReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(within(getDialog()).getByText(/in open air, away from any soil or water, then hold still/i)).toBeInTheDocument();
    });

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(validDryReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(within(getDialog()).getByText(/Gently lower/)).toBeInTheDocument();
    });

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(invalidWetReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(within(getDialog()).getByText(/submerged in water down to the white horizontal line/i)).toBeInTheDocument();
    });

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(validWetReading);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(deviceService.saveCalibrationValues).toHaveBeenCalledWith(1, 2700, 950);
      expect(onCalibrated).toHaveBeenCalled();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when saving calibration fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(deviceService.saveCalibrationValues).mockRejectedValue(new Error('Save failed'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachDryReadingStep(user);

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(validDryReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(within(getDialog()).getByText(/Gently lower/)).toBeInTheDocument();
    });

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(validWetReading);
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error saving calibration', message: 'Save failed' }),
      );
    });
    expect(within(getDialog()).getByText(/Gently lower/)).toBeInTheDocument();
  });

  it('retries dry reading after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);
    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(connectivityReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => {
      expect(within(getDialog()).getByText(/Waiting for a reading/i)).toBeInTheDocument();
    });

    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(null);
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Try again' }));

    expect(within(getDialog()).getByText('Before you start')).toBeInTheDocument();
    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeEnabled();
  }, 15000);

  async function reachWetReadingStep(user: ReturnType<typeof userEvent.setup>) {
    await reachDryReadingStep(user);
    vi.mocked(deviceService.getLatestCalibrationReading).mockResolvedValue(validDryReading);
    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(within(getDialog()).getByText(/Gently lower/)).toBeInTheDocument());
  }

  it('retries wet reading after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await reachWetReadingStep(user);

    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 2000);

    await waitFor(() => {
      expect(within(getDialog()).getByRole('button', { name: 'Restart calibration' })).toBeInTheDocument();
    });

    await user.click(within(getDialog()).getByRole('button', { name: 'Restart calibration' }));

    expect(within(getDialog()).getByText('Before you start')).toBeInTheDocument();
    expect(within(getDialog()).getByRole('button', { name: 'Start calibration' })).toBeEnabled();
  }, 15000);

  it('clears calibration mode when closing mid-flow', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);

    // Mantine modal close button is aria-hidden; query by its aria-label attribute.
    await user.click(screen.getByLabelText('Close calibration wizard'));

    expect(deviceService.clearCalibrationMode).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('logs when clearing calibration mode fails on close', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(deviceService.clearCalibrationMode).mockRejectedValue(new Error('Clear failed'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);
    await user.click(screen.getByLabelText('Close calibration wizard'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear calibration mode on close:',
        expect.any(Error),
      );
    });
    expect(onClose).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('logs poll errors without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.mocked(deviceService.getLatestCalibrationReading).mockRejectedValue(new Error('Poll failed'));

    renderWithProviders(
      <DeviceCalibrationWizard opened onClose={onClose} deviceId={1} />,
    );

    await startCalibration(user);

    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Calibration poll error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
