import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { FirmwareUploadForm } from '@/admin/components/FirmwareUploadForm';

const mockUploadFirmwareRelease = vi.fn();
const mockNotificationsShow = vi.fn();
const onUploaded = vi.fn();

vi.mock('@/admin/adminService', () => ({
  uploadFirmwareRelease: (...args: unknown[]) => mockUploadFirmwareRelease(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

function fileInput(): HTMLElement {
  return screen.getByLabelText('Firmware binary file');
}

describe('FirmwareUploadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadFirmwareRelease.mockResolvedValue(undefined);
  });

  it('shows a missing-fields notification when no binary is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareUploadForm releases={[]} onUploaded={onUploaded} />);

    await user.click(screen.getByRole('button', { name: 'Upload release' }));

    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'yellow',
      title: 'Missing fields',
      message: 'Board, OTA version (≥ 1), SemVer, and a .bin file are required.',
    });
    expect(mockUploadFirmwareRelease).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('shows an invalid-SemVer notification for a bad version string', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareUploadForm releases={[]} onUploaded={onUploaded} />);

    const file = new File(['bin'], 'app.bin', { type: 'application/octet-stream' });
    await user.upload(fileInput(), file);
    await user.clear(screen.getByLabelText('SemVer'));
    await user.type(screen.getByLabelText('SemVer'), '1.0');

    await user.click(screen.getByRole('button', { name: 'Upload release' }));

    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'yellow',
      title: 'Invalid SemVer',
      message: 'Use MAJOR.MINOR.PATCH (e.g. 1.2.0 or 1.2.0-beta.1).',
    });
    expect(mockUploadFirmwareRelease).not.toHaveBeenCalled();
  });

  it('uploads a release and notifies on success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareUploadForm releases={[]} onUploaded={onUploaded} />);

    const file = new File(['bin'], 'app.bin', { type: 'application/octet-stream' });
    await user.upload(fileInput(), file);
    await user.type(screen.getByLabelText('Description (optional)'), 'pilot-battery-fix');

    await user.click(screen.getByRole('button', { name: 'Upload release' }));

    await waitFor(() => {
      expect(mockUploadFirmwareRelease).toHaveBeenCalledWith(
        'esp32c6',
        1,
        '1.0.0',
        file,
        'pilot-battery-fix',
      );
    });
    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'green',
      title: 'Release staged',
      message: 'esp32c6 OTA v1 (1.0.0) uploaded. Publish or assign next.',
    });
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('');
  });

  it('shows an error notification when upload fails', async () => {
    const user = userEvent.setup();
    mockUploadFirmwareRelease.mockRejectedValue(new Error('storage full'));
    renderWithProviders(<FirmwareUploadForm releases={[]} onUploaded={onUploaded} />);

    const file = new File(['bin'], 'app.bin', { type: 'application/octet-stream' });
    await user.upload(fileInput(), file);
    await user.click(screen.getByRole('button', { name: 'Upload release' }));

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith({
        color: 'red',
        title: 'Upload failed',
        message: 'storage full',
      });
    });
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('uploads for the selected board', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareUploadForm releases={[]} onUploaded={onUploaded} />);

    await user.click(screen.getByRole('textbox', { name: 'Board' }));
    await user.click(await screen.findByRole('option', { name: 'ESP32-C5', hidden: true }));

    const file = new File(['bin'], 'app.bin', { type: 'application/octet-stream' });
    await user.upload(fileInput(), file);
    await user.click(screen.getByRole('button', { name: 'Upload release' }));

    await waitFor(() => {
      expect(mockUploadFirmwareRelease).toHaveBeenCalledWith(
        'esp32c5',
        1,
        '1.0.0',
        file,
        '',
      );
    });
  });
});


