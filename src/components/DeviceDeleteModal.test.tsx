import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within } from '@/test/render';
import { buildDevice } from '@/test/builders/device';
import DeviceDeleteModal from './DeviceDeleteModal';

const deleteDevice = vi.fn();
const onClose = vi.fn();
const onDeleted = vi.fn();

vi.mock('@/services/deviceService', () => ({
  deleteDevice: (...args: unknown[]) => deleteDevice(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

function getDialog() {
  return screen.getByRole('dialog');
}

describe('DeviceDeleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteDevice.mockResolvedValue(undefined);
  });

  it('renders device serial in confirmation message', () => {
    const device = buildDevice({ serialNumber: 'SN-ABC' });

    renderWithProviders(
      <DeviceDeleteModal opened device={device} onClose={onClose} onDeleted={onDeleted} />,
    );

    const dialog = getDialog();
    expect(within(dialog).getByText('SN-ABC')).toBeInTheDocument();
    expect(within(dialog).getByText(/sensor configuration/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <DeviceDeleteModal opened device={buildDevice()} onClose={onClose} onDeleted={onDeleted} />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(deleteDevice).not.toHaveBeenCalled();
  });

  it('deletes device and calls callbacks on confirm', async () => {
    const user = userEvent.setup();
    const device = buildDevice({ id: 7 });

    renderWithProviders(
      <DeviceDeleteModal opened device={device} onClose={onClose} onDeleted={onDeleted} />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Delete' }));

    expect(deleteDevice).toHaveBeenCalledWith(7);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('shows error notification when delete fails', async () => {
    const user = userEvent.setup();
    const { notifications } = await import('@mantine/notifications');
    deleteDevice.mockRejectedValue(new Error('Delete failed'));

    renderWithProviders(
      <DeviceDeleteModal opened device={buildDevice()} onClose={onClose} onDeleted={onDeleted} />,
    );

    await user.click(within(getDialog()).getByRole('button', { name: 'Delete' }));

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error', message: 'Delete failed' }),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
