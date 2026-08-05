import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { FirmwareTab } from '@/admin/components/FirmwareTab';
import type { FirmwareChannel, FirmwareRelease } from '@/admin/adminService';

const mockRefresh = vi.fn();
const mockUseFirmwareTab = vi.fn();
const mockPublishFirmwareToFleet = vi.fn();
const mockClearFirmwareOverridesForRelease = vi.fn();
const mockNotificationsShow = vi.fn();

vi.mock('@/admin/hooks/useFirmwareTab', () => ({
  useFirmwareTab: (...args: unknown[]) => mockUseFirmwareTab(...args),
}));

vi.mock('@/admin/adminService', () => ({
  publishFirmwareToFleet: (...args: unknown[]) => mockPublishFirmwareToFleet(...args),
  clearFirmwareOverridesForRelease: (...args: unknown[]) =>
    mockClearFirmwareOverridesForRelease(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

vi.mock('@/admin/components/FirmwareUploadForm', () => ({
  FirmwareUploadForm: ({ onUploaded }: { onUploaded: () => void }) => (
    <button type="button" onClick={onUploaded}>Upload release stub</button>
  ),
}));

vi.mock('@/admin/components/AssignFirmwareModal', () => ({
  AssignFirmwareModal: ({
    opened,
    release,
    onClose,
    onAssigned,
  }: {
    opened: boolean;
    release: FirmwareRelease | null;
    onClose: () => void;
    onAssigned: () => void;
  }) => (
    opened ? (
      <div>
        <span>Assign modal for v{release?.version}</span>
        <button type="button" onClick={onClose}>Close assign modal</button>
        <button type="button" onClick={onAssigned}>Assigned stub</button>
      </div>
    ) : null
  ),
}));

const stagedRelease: FirmwareRelease = {
  id: 1,
  board: 'esp32c6',
  version: 2,
  semver: '1.2.0',
  binary_url: 'https://cdn/a.bin',
  label: 'pilot',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const fleetRelease: FirmwareRelease = {
  id: 2,
  board: 'esp32c5',
  version: 3,
  semver: '1.3.0',
  binary_url: 'https://cdn/b.bin',
  label: null,
  createdAt: '2026-08-02T00:00:00Z',
  updatedAt: '2026-08-02T00:00:00Z',
};

const channels: FirmwareChannel[] = [{
  board: 'esp32c5',
  release_id: 2,
  updatedAt: '2026-08-02T00:00:00Z',
  release: fleetRelease,
}];

describe('FirmwareTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
    mockPublishFirmwareToFleet.mockResolvedValue(undefined);
    mockClearFirmwareOverridesForRelease.mockResolvedValue(undefined);
    mockUseFirmwareTab.mockReturnValue({
      releases: [stagedRelease, fleetRelease],
      channels,
      loading: false,
      refresh: mockRefresh,
    });
  });

  it('renders fleet channel summary and release rows', () => {
    renderWithProviders(<FirmwareTab />);

    expect(screen.getByRole('heading', { name: 'Firmware releases' })).toBeInTheDocument();
    expect(screen.getByText('No published release')).toBeInTheDocument();
    expect(screen.getByText('OTA v3 · 1.3.0')).toBeInTheDocument();
    expect(screen.getByText('1.2.0')).toBeInTheDocument();
    expect(screen.getByText('pilot')).toBeInTheDocument();
    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getByText('Staged')).toBeInTheDocument();
  });

  it('shows an empty state when there are no releases', () => {
    mockUseFirmwareTab.mockReturnValue({
      releases: [],
      channels: [],
      loading: false,
      refresh: mockRefresh,
    });

    renderWithProviders(<FirmwareTab />);

    expect(
      screen.getByText('No firmware releases yet. Upload a .bin to stage the first build.'),
    ).toBeInTheDocument();
  });

  it('disables Publish for the current fleet release', () => {
    renderWithProviders(<FirmwareTab />);

    const publishButtons = screen.getAllByRole('button', { name: 'Publish' });
    expect(publishButtons).toHaveLength(2);
    expect(publishButtons[0]).not.toBeDisabled();
    expect(publishButtons[1]).toBeDisabled();
  });

  it('publishes a staged release to the fleet', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getAllByRole('button', { name: 'Publish' })[0]);

    await waitFor(() => {
      expect(mockPublishFirmwareToFleet).toHaveBeenCalledWith('esp32c6', 1);
    });
    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'green',
      title: 'Published to fleet',
      message: 'esp32c6 channel now points to OTA v2 (1.2.0).',
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows an error notification when publish fails', async () => {
    const user = userEvent.setup();
    mockPublishFirmwareToFleet.mockRejectedValue(new Error('denied'));
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getAllByRole('button', { name: 'Publish' })[0]);

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith({
        color: 'red',
        title: 'Publish failed',
        message: 'denied',
      });
    });
  });

  it('clears overrides for a release', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getAllByRole('button', { name: 'Clear overrides' })[0]);

    await waitFor(() => {
      expect(mockClearFirmwareOverridesForRelease).toHaveBeenCalledWith(1);
    });
    expect(mockNotificationsShow).toHaveBeenCalledWith({
      color: 'green',
      title: 'Overrides cleared',
      message: 'Removed pilot overrides for esp32c6 OTA v2 (1.2.0).',
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('opens the assign modal for a release', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getAllByRole('button', { name: 'Assign' })[0]);

    expect(screen.getByText('Assign modal for v2')).toBeInTheDocument();
  });

  it('closes the assign modal and refreshes after assignment', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getAllByRole('button', { name: 'Assign' })[0]);
    await user.click(screen.getByRole('button', { name: 'Assigned stub' }));
    expect(mockRefresh).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Close assign modal' }));
    expect(screen.queryByText('Assign modal for v2')).not.toBeInTheDocument();
  });

  it('shows an error notification when clear overrides fails', async () => {
    const user = userEvent.setup();
    mockClearFirmwareOverridesForRelease.mockRejectedValue(new Error('timeout'));
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getAllByRole('button', { name: 'Clear overrides' })[0]);

    await waitFor(() => {
      expect(mockNotificationsShow).toHaveBeenCalledWith({
        color: 'red',
        title: 'Clear failed',
        message: 'timeout',
      });
    });
  });

  it('refreshes from the header refresh button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getByRole('button', { name: 'Refresh firmware releases' }));

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('refreshes when the upload form reports success', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FirmwareTab />);

    await user.click(screen.getByRole('button', { name: 'Upload release stub' }));

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows loading skeletons while releases load', () => {
    mockUseFirmwareTab.mockReturnValue({
      releases: [],
      channels: [],
      loading: true,
      refresh: mockRefresh,
    });

    renderWithProviders(<FirmwareTab />);

    expect(
      screen.queryByText('No firmware releases yet. Upload a .bin to stage the first build.'),
    ).not.toBeInTheDocument();
    // Header row + 4 skeleton rows from TableLoadingRows
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });
});


