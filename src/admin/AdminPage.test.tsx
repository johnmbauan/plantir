import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AdminPage from './AdminPage';

vi.mock('@/admin/components/DevicesTab', () => ({
  DevicesTab: () => <div>Admin devices tab</div>,
}));

vi.mock('@/admin/components/LogsTab', () => ({
  LogsTab: () => <div>Admin logs tab</div>,
}));

vi.mock('@/admin/components/FirmwareTab', () => ({
  FirmwareTab: () => <div>Admin firmware tab</div>,
}));

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
  });

  it('renders admin portal with devices tab by default', () => {
    renderAdminPage(createAdminPageRouter('/admin'));

    expect(screen.getByRole('heading', { name: 'Admin Portal' })).toBeInTheDocument();
    expect(screen.getByText('Admin devices tab')).toBeInTheDocument();
    expect(screen.queryByText('Admin logs tab')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin firmware tab')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sensors', selected: true })).toBeInTheDocument();
  });

  it('switches to logs tab and updates the URL', async () => {
    const user = userEvent.setup();
    const memoryRouter = createAdminPageRouter('/admin');
    renderAdminPage(memoryRouter);

    await user.click(screen.getByRole('tab', { name: 'Logs' }));

    expect(screen.getByText('Admin logs tab')).toBeInTheDocument();
    expect(screen.queryByText('Admin devices tab')).not.toBeInTheDocument();
    expect(memoryRouter.state.location.search).toBe('?tab=logs');
  });

  it('opens the logs tab when the URL includes tab=logs', () => {
    renderAdminPage(createAdminPageRouter('/admin?tab=logs'));

    expect(screen.getByText('Admin logs tab')).toBeInTheDocument();
    expect(screen.queryByText('Admin devices tab')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Logs', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sensors', selected: false })).toBeInTheDocument();
  });

  it('switches to firmware tab and updates the URL', async () => {
    const user = userEvent.setup();
    const memoryRouter = createAdminPageRouter('/admin');
    renderAdminPage(memoryRouter);

    await user.click(screen.getByRole('tab', { name: 'Firmware' }));

    expect(screen.getByText('Admin firmware tab')).toBeInTheDocument();
    expect(screen.queryByText('Admin devices tab')).not.toBeInTheDocument();
    expect(memoryRouter.state.location.search).toBe('?tab=firmware');
  });

  it('opens the firmware tab when the URL includes tab=firmware', () => {
    renderAdminPage(createAdminPageRouter('/admin?tab=firmware'));

    expect(screen.getByText('Admin firmware tab')).toBeInTheDocument();
    expect(screen.queryByText('Admin devices tab')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Firmware', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sensors', selected: false })).toBeInTheDocument();
  });
});
