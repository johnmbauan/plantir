import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AdminPage from './AdminPage';

const refresh = vi.fn();

vi.mock('@/admin/hooks/useAdminFilterOptions', () => ({
  useAdminFilterOptions: vi.fn(),
}));

vi.mock('@/admin/components/DevicesTab', () => ({
  DevicesTab: () => <div>Admin devices tab</div>,
}));

vi.mock('@/admin/components/LogsTab', () => ({
  LogsTab: () => <div>Admin logs tab</div>,
}));

import { useAdminFilterOptions } from '@/admin/hooks/useAdminFilterOptions';

const mockedUseAdminFilterOptions = vi.mocked(useAdminFilterOptions);

function createAdminPageRouter(route = '/admin') {
  return createMemoryRouter(
    [{ path: '/admin', element: <AdminPage /> }],
    { initialEntries: [route] },
  );
}

function renderAdminPage(router: ReturnType<typeof createAdminPageRouter>) {
  render(
    <MantineProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </MantineProvider>,
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAdminFilterOptions.mockReturnValue({
      filterOptions: {
        serials: ['SN-001'],
        owners: ['a@example.com'],
        plants: ['Monstera'],
        hasUnassignedOwner: false,
        hasUnassignedPlant: false,
      },
      loading: false,
      refresh,
    });
  });

  it('renders admin portal with devices tab by default', () => {
    renderAdminPage(createAdminPageRouter('/admin'));

    expect(screen.getByRole('heading', { name: 'Admin Portal' })).toBeInTheDocument();
    expect(screen.getByText('Admin devices tab')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Devices', selected: true })).toBeInTheDocument();
  });

  it('switches to logs tab and updates the URL', async () => {
    const user = userEvent.setup();
    const memoryRouter = createAdminPageRouter('/admin');
    renderAdminPage(memoryRouter);

    await user.click(screen.getByRole('tab', { name: 'Logs' }));

    expect(screen.getByText('Admin logs tab')).toBeInTheDocument();
    expect(memoryRouter.state.location.search).toBe('?tab=logs');
  });

  it('opens the logs tab when the URL includes tab=logs', () => {
    renderAdminPage(createAdminPageRouter('/admin?tab=logs'));

    expect(screen.getByText('Admin logs tab')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Logs', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Devices', selected: false })).toBeInTheDocument();
  });
});
