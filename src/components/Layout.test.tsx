import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, within } from '@/test/render';
import { buildSession, buildUser } from '@/test/builders/session';
import { mockSession, resetSupabaseMocks } from '@/test/mocks/supabase';
import Layout from '@/components/Layout';

vi.mock('@/components/NotificationBell', () => ({
  default: () => <div>Notification bell</div>,
}));

vi.mock('@/components/UserMenu', () => ({
  default: () => <button type="button">Account menu</button>,
}));

function renderLayout(route = '/dashboard') {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/profile" element={<div>Profile page</div>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('Layout', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSession(buildSession());
  });

  it('renders the app header and outlet content', async () => {
    renderLayout();

    expect(await screen.findByText('Plantir')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plantir home' })).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: 'Plantir home' })).getByTestId('brand-logo-mark')).toBeInTheDocument();
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.getByText('Notification bell')).toBeInTheDocument();
  });

  it('navigates to the dashboard when the Plantir logo is clicked', async () => {
    const user = userEvent.setup();
    renderLayout('/profile');

    expect(await screen.findByText('Profile page')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Plantir home' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  it('shows admin navigation for admin users', async () => {
    mockSession(
      buildSession({
        user: buildUser({ app_metadata: { role: 'admin' } }),
      }),
    );
    renderLayout();

    expect(await screen.findByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('shows the account menu', async () => {
    renderLayout();

    expect(await screen.findByRole('button', { name: 'Account menu' })).toBeInTheDocument();
  });
});
