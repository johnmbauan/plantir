import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import { buildSession, buildUser } from '@/test/builders/session';
import AdminGuard from '@/admin/AdminGuard';

vi.mock('@/context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/context/AuthContext')>('@/context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth } from '@/context/AuthContext';

function renderGuard() {
  return renderWithProviders(
    <Routes>
      <Route element={<AdminGuard />}>
        <Route path="/admin" element={<div>Admin panel</div>} />
      </Route>
      <Route path="/" element={<div>Home page</div>} />
    </Routes>,
    { route: '/admin' },
  );
}

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ session: null, user: null, loading: false });
  });

  it('redirects non-admin users to home', () => {
    const session = buildSession();
    vi.mocked(useAuth).mockReturnValue({
      session,
      user: session.user,
      loading: false,
    });
    renderGuard();

    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Admin panel')).not.toBeInTheDocument();
  });

  it('renders child routes for admin users', () => {
    const session = buildSession({
      user: buildUser({ app_metadata: { role: 'admin' } }),
    });
    vi.mocked(useAuth).mockReturnValue({
      session,
      user: session.user,
      loading: false,
    });
    renderGuard();

    expect(screen.getByText('Admin panel')).toBeInTheDocument();
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });
});
