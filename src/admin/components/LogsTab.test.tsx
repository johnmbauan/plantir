import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { LogsTab } from '@/admin/components/LogsTab';
import type { AdminFilterOptions, AdminLog } from '@/admin/adminService';
import { ADMIN_PAGE_SIZE } from '@/admin/constants';

const mockRefresh = vi.fn();
const mockUseAdminLogsPage = vi.fn();

vi.mock('@/admin/hooks/useAdminLogsPage', () => ({
  useAdminLogsPage: (...args: unknown[]) => mockUseAdminLogsPage(...args),
}));

const filterOptions: AdminFilterOptions = {
  serials: ['SN-001', 'SN-002'],
  owners: ['alice@example.com', 'bob@example.com'],
  plants: ['Monstera', 'Fern'],
  hasUnassignedOwner: false,
  hasUnassignedPlant: false,
};

const logs: AdminLog[] = [
  {
    id: 1,
    serialNumber: 'SN-001',
    level: 'info',
    message: 'Device connected',
    createdAt: '2026-07-06T08:00:00Z',
  },
  {
    id: 2,
    serialNumber: 'SN-002',
    level: 'error',
    message: 'WiFi failed',
    createdAt: '2026-07-05T08:00:00Z',
  },
];

function makeLogs(count: number): AdminLog[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    serialNumber: `SN-${String((i % 2) + 1).padStart(3, '0')}`,
    level: (['info', 'warning', 'error'] as const)[i % 3],
    message: `Log message ${i + 1}`,
    createdAt: new Date(2026, 0, count - i).toISOString(),
  }));
}

async function selectComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  value: string,
) {
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[index]);
  // Mantine keeps combobox options in a hidden portal until layout completes in jsdom.
  // eslint-disable-next-line testing-library/no-node-access
  const option = document.querySelector(`[data-combobox-option][value="${value}"]`);
  expect(option).toBeTruthy();
  await user.click(option!);
}

describe('Admin LogsTab', () => {
  beforeEach(() => {
    mockUseAdminLogsPage.mockImplementation((query: { page: number }) => ({
      items: logs,
      totalCount: logs.length,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));
  });

  it('renders log entries', () => {
    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    expect(screen.getByText('Device Logs')).toBeInTheDocument();
    expect(screen.getByText('Device connected')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'SN-001' })).toBeInTheDocument();
  });

  it('shows empty state when there are no logs', () => {
    mockUseAdminLogsPage.mockReturnValue({
      items: [],
      totalCount: 0,
      loading: false,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    expect(screen.getByText('No logs found.')).toBeInTheDocument();
  });

  it('calls refresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    await user.click(screen.getByRole('button', { name: 'Refresh logs' }));
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it('shows loading skeletons', () => {
    mockUseAdminLogsPage.mockReturnValue({
      items: [],
      totalCount: 0,
      loading: true,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    expect(screen.queryByText('No logs found.')).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('requests logs filtered by device serial', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    expect(mockUseAdminLogsPage).toHaveBeenCalledWith(
      expect.objectContaining({ serialNumber: null }),
    );

    await selectComboboxOption(user, 0, 'SN-001');

    expect(mockUseAdminLogsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ serialNumber: 'SN-001', page: 1 }),
    );
  });

  it('requests logs filtered by owner', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    await selectComboboxOption(user, 1, 'alice@example.com');

    expect(mockUseAdminLogsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ ownerEmail: 'alice@example.com', page: 1 }),
    );
  });

  it('requests logs filtered by level', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    await selectComboboxOption(user, 2, 'error');

    expect(mockUseAdminLogsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ level: 'error', page: 1 }),
    );
  });

  it('shows no filter match message when filters exclude all logs', async () => {
    const user = userEvent.setup();

    mockUseAdminLogsPage.mockImplementation((query: { level: string | null; page: number }) => ({
      items: query.level === 'warning' ? [] : logs,
      totalCount: query.level === 'warning' ? 0 : logs.length,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));

    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    await selectComboboxOption(user, 2, 'warning');

    expect(screen.getByText('No logs match your filters.')).toBeInTheDocument();
  });

  it('renders unknown log level with fallback color', () => {
    mockUseAdminLogsPage.mockReturnValue({
      items: [{ ...logs[0], level: 'debug' as 'info' }],
      totalCount: 1,
      loading: false,
      refresh: mockRefresh,
      currentPage: 1,
    });

    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    expect(screen.getByText('debug')).toBeInTheDocument();
  });

  it('shows server-side pagination summary', () => {
    mockUseAdminLogsPage.mockImplementation((query: { page: number }) => ({
      items: makeLogs(ADMIN_PAGE_SIZE),
      totalCount: ADMIN_PAGE_SIZE + 3,
      loading: false,
      refresh: mockRefresh,
      currentPage: query.page,
    }));

    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    expect(screen.getByText(`Showing 1–${ADMIN_PAGE_SIZE} of ${ADMIN_PAGE_SIZE + 3}`)).toBeInTheDocument();
  });

  it('requests sort changes from the server', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogsTab filterOptions={filterOptions} />);

    await user.click(screen.getByRole('button', { name: 'Sort by Message' }));

    expect(mockUseAdminLogsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortKey: 'message', sortDir: 'asc', page: 1 }),
    );
  });
});
