import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import { buildSession, buildUser } from '@/test/builders/session';
import { mockSession, resetSupabaseMocks } from '@/test/mocks/supabase';
import supabase from '@/supabase';
import Layout from '@/components/Layout';

vi.mock('@/components/NotificationBell', () => ({
  default: () => <div>Notification bell</div>,
}));

function renderLayout(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<div>Page content</div>} />
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
    Object.assign(supabase.auth, {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('renders the app header and outlet content', async () => {
    renderLayout();

    expect(await screen.findByText('🪴 Plantir')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByText('Notification bell')).toBeInTheDocument();
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

  it('signs out and navigates to login', async () => {
    const user = userEvent.setup();
    renderLayout();

    await screen.findByText('Page content');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
});
