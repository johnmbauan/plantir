import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildDevice, buildHumidityConfig } from '@/test/builders/device';
import { buildPlant } from '@/test/builders/plant';
import DevicesTab from '@/components/DevicesTab';

const mockNavigate = vi.fn();
const markOnboardingStepComplete = vi.fn();

vi.mock('@/services/onboardingService', () => ({
  markOnboardingStepComplete: (...args: unknown[]) => markOnboardingStepComplete(...args),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/deviceService', () => ({
  fetchDevices: vi.fn(),
}));

vi.mock('@/services/plantService', () => ({
  fetchPlants: vi.fn(),
}));

const DeviceFormModalMock = vi.fn<(props: unknown) => null>(() => null);
const DeviceDeleteModalMock = vi.fn<(props: unknown) => null>(() => null);
const DeviceRegistrationWizardMock = vi.fn<(props: unknown) => null>(() => null);
const DeviceCalibrationWizardMock = vi.fn<(props: unknown) => null>(() => null);

vi.mock('@/components/DeviceFormModal', () => ({
  default: (props: unknown) => DeviceFormModalMock(props),
}));

vi.mock('@/components/DeviceDeleteModal', () => ({
  default: (props: unknown) => DeviceDeleteModalMock(props),
}));

vi.mock('@/components/DeviceRegistrationWizard', () => ({
  default: (props: unknown) => DeviceRegistrationWizardMock(props),
}));

vi.mock('@/components/DeviceCalibrationWizard', () => ({
  default: (props: unknown) => DeviceCalibrationWizardMock(props),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

import { fetchDevices } from '@/services/deviceService';
import { fetchPlants } from '@/services/plantService';

function lastMockCall<T>(calls: unknown[][]): T {
  return calls[calls.length - 1]?.[0] as T;
}

function lastWizardCallbacks() {
  return lastMockCall<{
    onRegistered: () => void;
    onFinished: () => void;
  }>(DeviceRegistrationWizardMock.mock.calls);
}

function lastFormCallbacks() {
  return lastMockCall<{
    onSaved: () => void;
    onFinished: () => void;
    onOpenCalibration: (device: unknown) => void;
    onClose: () => void;
  }>(DeviceFormModalMock.mock.calls);
}

function lastCalibrationCallbacks() {
  return lastMockCall<{
    onClose: () => void;
  }>(DeviceCalibrationWizardMock.mock.calls);
}

describe('DevicesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    markOnboardingStepComplete.mockReset();
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: true, dismissed: false });
    localStorage.clear();
    vi.mocked(fetchDevices).mockResolvedValue([buildDevice()]);
    vi.mocked(fetchPlants).mockResolvedValue([buildPlant()]);
  });

  it('renders loaded devices without a redundant Devices heading', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);

    expect(await screen.findByText('SN-001')).toBeInTheDocument();
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.queryByText('Sensors')).not.toBeInTheDocument();
  });

  it('shows a calibration-recommended chip for uncalibrated devices', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({
        humidityConfig: buildHumidityConfig({ calibrated_at: null }),
      }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    const chip = screen.getByRole('button', { name: 'Calibration recommended' });
    expect(chip).toHaveClass('filter-chip--calibration');
    expect(chip).toHaveClass('filter-chip--static');
    expect(chip).toHaveTextContent('Calibration recommended');
  });

  it('does not show calibration-recommended chip for calibrated devices', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({
        humidityConfig: buildHumidityConfig({ calibrated_at: '2026-06-01T00:00:00Z' }),
      }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    expect(screen.queryByRole('button', { name: 'Calibration recommended' })).not.toBeInTheDocument();
  });

  it('renders icon-only action chips without label expansion', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({
        humidityConfig: buildHumidityConfig({ calibrated_at: '2026-06-01T00:00:00Z' }),
      }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    const calibrate = screen.getByRole('button', { name: 'Calibrate sensor' });
    expect(calibrate).toHaveClass('filter-chip--healthy');
    expect(calibrate).toHaveClass('filter-chip--icon-only');
    expect(calibrate).not.toHaveClass('filter-chip--expand-label');
    expect(calibrate).not.toHaveClass('filter-chip--static');

    const edit = screen.getByRole('button', { name: 'Edit sensor' });
    expect(edit).toHaveClass('filter-chip--edit');
    expect(edit).toHaveClass('filter-chip--icon-only');
    expect(edit).not.toHaveClass('filter-chip--expand-label');
    expect(edit).not.toHaveClass('filter-chip--static');

    const remove = screen.getByRole('button', { name: 'Delete sensor' });
    expect(remove).toHaveClass('filter-chip--danger');
    expect(remove).toHaveClass('filter-chip--icon-only');
    expect(remove).not.toHaveClass('filter-chip--expand-label');
    expect(remove).not.toHaveClass('filter-chip--static');
  });

  it('shows empty state when there are no devices', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([]);
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);

    expect(await screen.findByText('No sensors yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register your first sensor' })).toBeInTheDocument();
  });

  it('filters devices by search query', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice(),
      buildDevice({ id: 2, serialNumber: 'SN-002', plantName: 'Fern' }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.type(screen.getByPlaceholderText('Search by serial or plant…'), 'fern');

    expect(screen.queryByText('SN-001')).not.toBeInTheDocument();
    expect(screen.getByText('SN-002')).toBeInTheDocument();
  });

  it('sorts devices by serial ascending by default', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({ id: 1, serialNumber: 'SN-M' }),
      buildDevice({ id: 2, serialNumber: 'SN-Z' }),
      buildDevice({ id: 3, serialNumber: 'SN-A' }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-A');

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('SN-A');
    expect(rows[2]).toHaveTextContent('SN-M');
    expect(rows[3]).toHaveTextContent('SN-Z');
  });

  it('toggles serial sort direction when the Serial Number header is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({ id: 1, serialNumber: 'SN-M' }),
      buildDevice({ id: 2, serialNumber: 'SN-Z' }),
      buildDevice({ id: 3, serialNumber: 'SN-A' }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-A');

    await user.click(screen.getByRole('button', { name: 'Sort by Serial Number' }));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('SN-Z');
    expect(rows[2]).toHaveTextContent('SN-M');
    expect(rows[3]).toHaveTextContent('SN-A');
  });

  it('sorts by interval when the Interval header is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({
        id: 1,
        serialNumber: 'SN-MID',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 14_400 }),
      }),
      buildDevice({
        id: 2,
        serialNumber: 'SN-HIGH',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 28_800 }),
      }),
      buildDevice({
        id: 3,
        serialNumber: 'SN-LOW',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 3_600 }),
      }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-MID');

    await user.click(screen.getByRole('button', { name: 'Sort by Interval' }));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('SN-LOW');
    expect(rows[2]).toHaveTextContent('SN-MID');
    expect(rows[3]).toHaveTextContent('SN-HIGH');
  });

  it('sorts by plant when the Plant header is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({ id: 1, serialNumber: 'SN-1', plantName: 'Mango' }),
      buildDevice({ id: 2, serialNumber: 'SN-2', plantName: 'Zebra' }),
      buildDevice({ id: 3, serialNumber: 'SN-3', plantName: 'Apple' }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Mango');

    await user.click(screen.getByRole('button', { name: 'Sort by Plant' }));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple');
    expect(rows[2]).toHaveTextContent('Mango');
    expect(rows[3]).toHaveTextContent('Zebra');
  });

  it('does not render a Type column', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    expect(screen.queryByRole('button', { name: 'Sort by Type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /^Type$/ })).not.toBeInTheDocument();
  });

  it('shows Unassigned and an em dash when plant and interval are missing', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({
        plantId: null,
        plantName: null,
        humidityConfig: null,
      }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calibration recommended' })).toBeInTheDocument();
  });

  it('clears the calibrating device when the calibration wizard closes', async () => {
    const user = userEvent.setup();
    const device = buildDevice({ id: 9 });
    vi.mocked(fetchDevices).mockResolvedValue([device]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Calibrate sensor' }));

    expect(DeviceCalibrationWizardMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, deviceId: 9 }),
    );

    const openCall = DeviceCalibrationWizardMock.mock.calls[
      DeviceCalibrationWizardMock.mock.calls.length - 1
    ]?.[0] as {
      onClose: () => void;
    };
    openCall.onClose();

    await waitFor(() => {
      expect(DeviceCalibrationWizardMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ opened: false, deviceId: null }),
      );
    });
  });

  it('shows no search results message when filter matches nothing', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([buildDevice()]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.type(screen.getByPlaceholderText('Search by serial or plant…'), 'nomatch');

    expect(screen.getByText('No sensors match your search.')).toBeInTheDocument();
  });

  it('shows error notification when loading fails', async () => {
    const { notifications } = await import('@mantine/notifications');
    vi.mocked(fetchDevices).mockRejectedValue(new Error('Load failed'));

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Load failed' }),
      );
    });
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    const device = buildDevice();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Edit sensor' }));

    expect(DeviceFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingDevice: device }),
    );
  });

  it('opens delete modal when delete button is clicked', async () => {
    const user = userEvent.setup();
    const device = buildDevice();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Delete sensor' }));

    expect(DeviceDeleteModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, device }),
    );
  });

  it('opens calibration wizard when calibrate button is clicked', async () => {
    const user = userEvent.setup();
    const device = buildDevice();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Calibrate sensor' }));

    expect(DeviceCalibrationWizardMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, deviceId: device.id }),
    );
  });

  it('opens edit modal from deviceId URL param', async () => {
    const device = buildDevice({ id: 5 });

    vi.mocked(fetchDevices).mockResolvedValue([device]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />, {
      route: '/?deviceId=5',
    });

    await waitFor(() => {
      expect(DeviceFormModalMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true, editingDevice: device }),
      );
    });
  });

  it('renders the toolbar with search and both action buttons', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    expect(screen.getByRole('button', { name: 'Search sensors' })).toBeInTheDocument();

    const addManually = screen.getByRole('button', { name: 'Add manually' });
    const register = screen.getByRole('button', { name: 'Register new sensor' });
    expect(addManually).toBeInTheDocument();
    expect(register).toBeInTheDocument();

    const actions = screen.getByTestId('center-tab-toolbar-actions');
    expect(actions).toContainElement(addManually);
    expect(actions).toContainElement(register);
    expect(addManually).toHaveAttribute('data-variant', 'default');
    expect(register).not.toHaveAttribute('data-variant', 'default');
  });

  it('opens add device modal from Add manually button', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Add manually' }));

    expect(DeviceFormModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true, editingDevice: null }),
    );
  });

  it('records the devices onboarding step when a device is added manually', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    lastFormCallbacks().onSaved();

    expect(markOnboardingStepComplete).toHaveBeenCalledWith('devices');
  });

  it('does not record the devices onboarding step when an existing device is saved', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Edit sensor' }));
    lastFormCallbacks().onSaved();

    expect(markOnboardingStepComplete).not.toHaveBeenCalled();
  });

  it('returns to the dashboard after finishing manual device creation during onboarding', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    const { onSaved, onFinished } = lastFormCallbacks();
    onSaved();
    onFinished();

    await waitFor(() => {
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('devices');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('stays on plants center after manual create when the devices step is already complete', async () => {
    const user = userEvent.setup();
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: false, dismissed: false });

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    const { onSaved, onFinished } = lastFormCallbacks();
    onSaved();
    onFinished();

    await waitFor(() => {
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('devices');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('returns to the dashboard after the first manual device even if onboarding was dismissed', async () => {
    const user = userEvent.setup();
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: true, dismissed: true });

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    const { onSaved, onFinished } = lastFormCallbacks();
    onSaved();
    onFinished();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('waits until calibration ends before returning after a first manual device', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    const { onSaved, onOpenCalibration } = lastFormCallbacks();
    onSaved();
    onOpenCalibration(buildDevice({ id: 99 }));

    await waitFor(() => {
      expect(DeviceCalibrationWizardMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true, deviceId: 99 }),
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    lastCalibrationCallbacks().onClose();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });


  it('opens registration wizard from header button', async () => {
    const user = userEvent.setup();

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    await user.click(screen.getByRole('button', { name: 'Register new sensor' }));

    expect(DeviceRegistrationWizardMock).toHaveBeenCalledWith(
      expect.objectContaining({ opened: true }),
    );
  });

  it('passes plant assignment options to device modals', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({ id: 10, plantId: 1, plantName: 'Monstera' }),
    ]);
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 1, name: 'Monstera', deviceId: 10 }),
      buildPlant({ id: 2, name: 'Ficus', deviceId: null }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    expect(DeviceRegistrationWizardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        plantOptions: [
          expect.objectContaining({ value: '1', label: 'Monstera', hasDevice: true }),
          expect.objectContaining({ value: '2', label: 'Ficus', hasDevice: false }),
        ],
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Edit sensor' }));

    expect(DeviceFormModalMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        editingDevice: expect.objectContaining({ id: 10 }),
        plantOptions: [
          expect.objectContaining({ value: '1', label: 'Monstera', hasDevice: false }),
          expect.objectContaining({ value: '2', label: 'Ficus', hasDevice: false }),
        ],
      }),
    );
  });

  it('returns to the dashboard after completing the devices onboarding step', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    const { onRegistered, onFinished } = lastWizardCallbacks();
    onRegistered();
    onFinished();

    await waitFor(() => {
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('devices');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('stays on plants center after registering a device when that step is already complete', async () => {
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: false, dismissed: false });

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    const { onRegistered, onFinished } = lastWizardCallbacks();
    onRegistered();
    onFinished();

    await waitFor(() => {
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('devices');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('returns to the dashboard after the first device even if onboarding was dismissed', async () => {
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: true, dismissed: true });

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('SN-001');

    const { onRegistered, onFinished } = lastWizardCallbacks();
    onRegistered();
    onFinished();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('opens registration wizard from register=1 URL param', async () => {
    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />, {
      route: '/?register=1',
    });

    await waitFor(() => {
      expect(DeviceRegistrationWizardMock).toHaveBeenCalledWith(
        expect.objectContaining({ opened: true }),
      );
    });
  });

  it('renders the assigned plant image when available', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({ plantId: 1, plantName: 'Monstera' }),
    ]);
    vi.mocked(fetchPlants).mockResolvedValue([
      buildPlant({ id: 1, name: 'Monstera', image_url: 'https://cdn/plant.jpg' }),
    ]);

    renderWithProviders(<DevicesTab reloadKey={0} onMutated={vi.fn()} />);
    await screen.findByText('Monstera');

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn/plant.jpg');
  });

  it('switches to plants tab with plantId when the plant name is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchDevices).mockResolvedValue([
      buildDevice({ plantId: 7, plantName: 'Fern' }),
    ]);

    function SearchParamsSpy() {
      const [params] = useSearchParams();
      return <div data-testid="params">{params.toString()}</div>;
    }

    renderWithProviders(
      <>
        <DevicesTab reloadKey={0} onMutated={vi.fn()} />
        <SearchParamsSpy />
      </>,
    );
    await screen.findByText('Fern');

    await user.click(screen.getByText('Fern'));

    await waitFor(() => {
      expect(screen.getByTestId('params').textContent).toBe('tab=plants&plantId=7');
    });
  });
});
