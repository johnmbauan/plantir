import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';
import { AssignFirmwareModal } from '@/admin/components/AssignFirmwareModal';
import type { FirmwareRelease } from '@/admin/adminService';

const mockFetchAdminDevicesForBoard = vi.fn();
const mockAssignFirmwareOverride = vi.fn();
const mockNotificationsShow = vi.fn();
const onClose = vi.fn();
const onAssigned = vi.fn();

vi.mock('@/admin/adminService', () => ({
  fetchAdminDevicesForBoard: (...args: unknown[]) => mockFetchAdminDevicesForBoard(...args),
  assignFirmwareOverride: (...args: unknown[]) => mockAssignFirmwareOverride(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

const release: FirmwareRelease = {
  id: 10,
  board: 'esp32c6',
  version: 2,
  semver: '1.2.0',
  binary_url: 'https://cdn/firmware.bin',
  label: 'pilot',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const devices = [
  {
    id: 1,
    serialNumber: 'SN-001',
    firmwareBoard: 'esp32c6',
    firmwareVersion: 1,
    firmwareOverrideReleaseId: null,
  },
  {
    id: 2,
    serialNumber: 'SN-002',
    firmwareBoard: null,
    firmwareVersion: null,
    firmwareOverrideReleaseId: 9,
  },
];

function renderModal(overrides: {
  release?: FirmwareRelease | null;
  opened?: boolean;
} = {}) {
  return renderWithProviders(
    <AssignFirmwareModal
      release={release}
      opened
      onClose={onClose}
      onAssigned={onAssigned}
      {...overrides}
    />,
  );
}

describe('AssignFirmwareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAdminDevicesForBoard.mockResolvedValue(devices);
    mockAssignFirmwareOverride.mockResolvedValue(undefined);
  });

  it('loads devices for the release board when opened', async () => {
    renderModal();

    expect(
      await screen.findByRole('dialog', {
        name: 'Assign OTA v2 · 1.2.0 (esp32c6)',
      }),
    ).toBeInTheDocument();
    expect(mockFetchAdminDevicesForBoard).toHaveBeenCalledWith('esp32c6');
    expect(await screen.findByText(/SN-001/)).toBeInTheDocument();
    expect(screen.getByText(/reported v1/)).toBeInTheDocument();
    expect(screen.getByText(/has override/)).toBeInTheDocument();
  });

  it('shows an empty state when no devices match the board', async () => {
    mockFetchAdminDevicesForBoard.mockResolvedValue([]);
    renderModal();

    expect(await screen.findByText('No sensors found for this board.')).toBeInTheDocument();
  });

  it('notifies when device loading fails', async () => {
    mockFetchAdminDevicesForBoard.mockRejectedValue(new Error('timeout'));
    renderModal();

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith({
        color: 'red',
        title: 'Failed to load sensors',
        message: 'timeout',
      });
    });
  });

  it('keeps Assign disabled until a device is selected', async () => {
    renderModal();
    await screen.findByText(/SN-001/);

    expect(screen.getByRole('button', { name: /Assign to/ })).toBeDisabled();
  });

  it('assigns the selected devices and closes on success', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText(/SN-001/);

    await user.click(screen.getByRole('checkbox', { name: /SN-001/ }));
    await user.click(screen.getByRole('button', { name: 'Assign to 1 sensor' }));

    await waitFor(() => {
      expect(mockAssignFirmwareOverride).toHaveBeenCalledWith([1], 10);
    });
    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'green',
      title: 'Override assigned',
      message: 'Pinned OTA v2 (1.2.0) on 1 sensor(s).',
    });
    expect(onAssigned).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('can deselect a device before assigning', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText(/SN-001/);

    const checkbox = screen.getByRole('checkbox', { name: /SN-001/ });
    await user.click(checkbox);
    expect(screen.getByRole('button', { name: 'Assign to 1 sensor' })).toBeEnabled();

    await user.click(checkbox);
    expect(screen.getByRole('button', { name: /Assign to/ })).toBeDisabled();
  });

  it('shows a loading message while devices are fetched', async () => {
    let resolveDevices: (value: typeof devices) => void = () => undefined;
    mockFetchAdminDevicesForBoard.mockReturnValue(
      new Promise((resolve) => {
        resolveDevices = resolve;
      }),
    );

    renderModal();

    expect(screen.getByText('Loading sensors…')).toBeInTheDocument();
    resolveDevices(devices);
    expect(await screen.findByText(/SN-001/)).toBeInTheDocument();
  });


  it('shows an error notification when assign fails', async () => {
    const user = userEvent.setup();
    mockAssignFirmwareOverride.mockRejectedValue(new Error('denied'));
    renderModal();
    await screen.findByText(/SN-001/);

    await user.click(screen.getByRole('checkbox', { name: /SN-001/ }));
    await user.click(screen.getByRole('button', { name: 'Assign to 1 sensor' }));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith({
        color: 'red',
        title: 'Assign failed',
        message: 'denied',
      });
    });
    expect(onAssigned).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText(/SN-001/);

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockAssignFirmwareOverride).not.toHaveBeenCalled();
  });
});
