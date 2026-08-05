import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Table } from '@mantine/core';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { AdminDeviceRow } from '@/admin/components/AdminDeviceRow';
import type { AdminDevice } from '@/admin/adminService';

const mockClearFirmwareOverrides = vi.fn();
const mockNotificationsShow = vi.fn();

vi.mock('@/admin/adminService', () => ({
  clearFirmwareOverrides: (...args: unknown[]) => mockClearFirmwareOverrides(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

const device = (overrides: Partial<AdminDevice> = {}): AdminDevice => ({
  id: 1,
  serialNumber: 'SN-001',
  type: 'humidity',
  user_id: 'user-1',
  owner_email: 'alice@example.com',
  plantName: 'Monstera',
  lastHumidity: 55,
  lastBattery: 80,
  lastSeenAt: '2026-07-06T08:00:00Z',
  firmwareVersion: 1,
  firmwareBoard: 'esp32c6',
  firmwareReportedAt: '2026-07-06T08:00:00Z',
  firmwareOverrideReleaseId: null,
  firmwareOverrideVersion: null,
  ...overrides,
});

function renderRow(
  rowDevice: AdminDevice,
  onOverrideCleared?: () => void,
) {
  renderWithProviders(
    <Table>
      <Table.Tbody>
        <AdminDeviceRow device={rowDevice} onOverrideCleared={onOverrideCleared} />
      </Table.Tbody>
    </Table>,
  );
}

describe('AdminDeviceRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearFirmwareOverrides.mockResolvedValue(undefined);
  });

  it('renders device fields', () => {
    renderRow(device());

    expect(screen.getByRole('cell', { name: 'SN-001' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'alice@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Monstera' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'humidity' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '55%' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '80%' })).toBeInTheDocument();
    expect(screen.getByText('v1 (esp32c6)')).toBeInTheDocument();
  });

  it('shows firmware override badge and clear action', () => {
    renderRow(device({
      firmwareOverrideReleaseId: 9,
      firmwareOverrideVersion: 2,
    }));

    expect(screen.getByText('Override v2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('shows Override v? when override version is missing', () => {
    renderRow(device({
      firmwareOverrideReleaseId: 9,
      firmwareOverrideVersion: null,
    }));

    expect(screen.getByText('Override v?')).toBeInTheDocument();
  });

  it('clears the override, notifies, and calls onOverrideCleared', async () => {
    const user = userEvent.setup();
    const onOverrideCleared = vi.fn();
    renderRow(
      device({
        firmwareOverrideReleaseId: 9,
        firmwareOverrideVersion: 2,
      }),
      onOverrideCleared,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => {
      expect(mockClearFirmwareOverrides).toHaveBeenCalledWith([1]);
    });
    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'green',
      title: 'Override cleared',
      message: 'SN-001 will follow the fleet channel.',
    });
    expect(onOverrideCleared).toHaveBeenCalledTimes(1);
  });

  it('shows an error notification when clear fails', async () => {
    const user = userEvent.setup();
    mockClearFirmwareOverrides.mockRejectedValue(new Error('denied'));
    const onOverrideCleared = vi.fn();
    renderRow(
      device({
        firmwareOverrideReleaseId: 9,
        firmwareOverrideVersion: 2,
      }),
      onOverrideCleared,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith({
        color: 'red',
        title: 'Clear failed',
        message: 'denied',
      });
    });
    expect(onOverrideCleared).not.toHaveBeenCalled();
  });

  it('renders placeholders for missing values', () => {
    renderRow(device({
      owner_email: null,
      plantName: null,
      lastHumidity: null,
      lastBattery: null,
      lastSeenAt: null,
      firmwareVersion: null,
      firmwareBoard: null,
    }));

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

