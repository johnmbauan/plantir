import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { DevicesTab } from '@/admin/components/DevicesTab';
import type { AdminDevice, AdminFilterOptions } from '@/admin/adminService';
import { ADMIN_PAGE_SIZE } from '@/admin/constants';

const mockRefresh = vi.fn();
const mockUseAdminDevicesPage = vi.fn();

vi.mock('@/admin/hooks/useAdminDevicesPage', () => ({
  useAdminDevicesPage: (...args: unknown[]) => mockUseAdminDevicesPage(...args),
}));

const filterOptions: AdminFilterOptions = {
  serials: ['SN-001', 'SN-002'],
  owners: ['alice@example.com', 'bob@example.com'],
  plants: ['Monstera', 'Fern'],
  hasUnassignedOwner: false,
  hasUnassignedPlant: false,
};

const firmwareDefaults = {
  firmwareVersion: null as number | null,
  firmwareBoard: null as string | null,
  firmwareReportedAt: null as string | null,
  firmwareOverrideReleaseId: null as number | null,
  firmwareOverrideVersion: null as number | null,
};

const devices: AdminDevice[] = [
  {
    id: 1,
    serialNumber: 'SN-001',
    type: 'humidity',
    user_id: 'user-1',
    owner_email: 'alice@example.com',
    plantName: 'Monstera',
    lastHumidity: 55,
    lastBattery: 80,
    lastSeenAt: '2026-07-06T08:00:00Z',
    ...firmwareDefaults,
  },
  {
    id: 2,
    serialNumber: 'SN-002',
    type: 'humidity',
    user_id: 'user-2',
    owner_email: 'bob@example.com',
    plantName: 'Fern',
    lastHumidity: 40,
    lastBattery: 60,
    lastSeenAt: '2026-07-05T08:00:00Z',
    ...firmwareDefaults,
  },
];

const sampleDevice = (overrides: Partial<AdminDevice> = {}): AdminDevice => ({
  ...devices[0],
  ...overrides,
});

function makeDevices(count: number): AdminDevice[] {
  return Array.from({ length: count }, (_, i) =>
    sampleDevice({
      id: i + 1,
      serialNumber: `SN-${String(i + 1).padStart(3, '0')}`,
      owner_email: `user${i + 1}@example.com`,
      plantName: `Plant ${i + 1}`,
      lastSeenAt: new Date(2026, 0, count - i).toISOString(),
    }),
  );
}

async function selectComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  value: string,
) {
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[index]);
  const option = await screen.findByRole('option', { name: value, hidden: true });
  await user.click(option);
}

describe('Admin DevicesTab', () => {
  beforeEach(() => {
    mockUseAdminDevicesPage.mockImplementation((query: { page: number }) => ({
      items: [sampleDevice()],
      totalCount: 1,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));
  });

  it('renders device rows', () => {
    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(screen.getByText('All Devices')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'SN-001' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'alice@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Monstera' })).toBeInTheDocument();
  });

  it('requests devices filtered by serial', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(mockUseAdminDevicesPage).toHaveBeenCalledWith(
      expect.objectContaining({ serialNumber: null }),
    );

    await selectComboboxOption(user, 0, 'SN-001');

    expect(mockUseAdminDevicesPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ serialNumber: 'SN-001', page: 1 }),
    );
  });

  it('requests devices filtered by owner', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    await selectComboboxOption(user, 1, 'alice@example.com');

    expect(mockUseAdminDevicesPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ ownerEmail: 'alice@example.com', page: 1 }),
    );
  });

  it('requests devices filtered by plant', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    await selectComboboxOption(user, 2, 'Fern');

    expect(mockUseAdminDevicesPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ plantName: 'Fern', page: 1 }),
    );
  });

  it('shows empty state when no devices exist', () => {
    mockUseAdminDevicesPage.mockReturnValue({
      items: [],
      totalCount: 0,
      loading: false,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(screen.getByText('No devices registered.')).toBeInTheDocument();
  });

  it('calls refresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockRefreshFilters = vi.fn();
    renderWithProviders(
      <DevicesTab filterOptions={filterOptions} onRefreshFilters={mockRefreshFilters} />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh devices' }));
    expect(mockRefresh).toHaveBeenCalledOnce();
    expect(mockRefreshFilters).toHaveBeenCalledOnce();
  });

  it('shows loading skeletons', () => {
    mockUseAdminDevicesPage.mockReturnValue({
      items: [],
      totalCount: 0,
      loading: true,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(screen.queryByRole('cell', { name: 'SN-001' })).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows no filter match message when filters exclude all devices', async () => {
    const user = userEvent.setup();

    mockUseAdminDevicesPage.mockImplementation((query: { plantName: string | null; page: number }) => ({
      items: query.plantName === 'Fern' ? [] : [sampleDevice()],
      totalCount: query.plantName === 'Fern' ? 0 : 1,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    await selectComboboxOption(user, 2, 'Fern');

    expect(screen.getByText('No devices match your filters.')).toBeInTheDocument();
  });

  it('renders placeholders for missing owner and readings', () => {
    mockUseAdminDevicesPage.mockReturnValue({
      items: [{
        ...sampleDevice(),
        owner_email: null,
        plantName: null,
        lastHumidity: null,
        lastBattery: null,
        lastSeenAt: null,
      }],
      totalCount: 1,
      loading: false,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows server-side pagination summary', () => {
    mockUseAdminDevicesPage.mockImplementation((query: { page: number }) => ({
      items: makeDevices(ADMIN_PAGE_SIZE),
      totalCount: ADMIN_PAGE_SIZE + 5,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(screen.getByText(`Showing 1–${ADMIN_PAGE_SIZE} of ${ADMIN_PAGE_SIZE + 5}`)).toBeInTheDocument();
  });

  it('requests the next page when pagination is clicked', async () => {
    const user = userEvent.setup();
    mockUseAdminDevicesPage.mockImplementation((query: { page: number }) => ({
      items: makeDevices(ADMIN_PAGE_SIZE),
      totalCount: ADMIN_PAGE_SIZE + 5,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    await user.click(screen.getByRole('button', { name: '2' }));

    expect(mockUseAdminDevicesPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it('requests sort changes from the server', async () => {
    const user = userEvent.setup();
    mockUseAdminDevicesPage.mockReturnValue({
      items: [
        sampleDevice({ serialNumber: 'SN-B' }),
        sampleDevice({ id: 2, serialNumber: 'SN-A' }),
      ],
      totalCount: 2,
      loading: false,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    await user.click(screen.getByRole('button', { name: 'Sort by Serial Number' }));

    expect(mockUseAdminDevicesPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortKey: 'serialNumber', sortDir: 'asc', page: 1 }),
    );
  });

  it('renders the Firmware column and reported version', () => {
    mockUseAdminDevicesPage.mockReturnValue({
      items: [
        sampleDevice({
          firmwareVersion: 3,
          firmwareBoard: 'esp32c6',
        }),
      ],
      totalCount: 1,
      loading: false,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    expect(screen.getByRole('button', { name: 'Sort by Firmware' })).toBeInTheDocument();
    expect(screen.getByText('v3 (esp32c6)')).toBeInTheDocument();
  });

  it('requests firmware version sort from the server', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DevicesTab filterOptions={filterOptions} />);

    await user.click(screen.getByRole('button', { name: 'Sort by Firmware' }));

    expect(mockUseAdminDevicesPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortKey: 'firmwareVersion', sortDir: 'asc', page: 1 }),
    );
  });
});

