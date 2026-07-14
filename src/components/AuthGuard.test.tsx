import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildSession } from '@/test/builders/session';
import { mockSession, mockGetUser, mockOnAuthStateChange, resetSupabaseMocks } from '@/test/mocks/supabase';
import { markPendingPasswordSetup, clearPendingPasswordSetup } from '@/pages/password/password-helper';
import AuthGuard from '@/components/AuthGuard';

function renderGuard(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route element={<AuthGuard />}>
        <Route path="/" element={<div>Protected content</div>} />
        <Route path="/dashboard" element={<div>Protected content</div>} />
      </Route>
      <Route path="/login" element={<div>Login page</div>} />
      <Route path="/set-password" element={<div>Set password page</div>} />
    </Routes>,
    { route },
  );
}

describe('AuthGuard', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    clearPendingPasswordSetup();
  });

  it('redirects unauthenticated users to login', async () => {
    mockSession(null);
    renderGuard();

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders child routes when authenticated', async () => {
    mockSession(buildSession());
    renderGuard();

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('shows a loader while session is loading', async () => {
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    renderGuard();

    await waitFor(() => {
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
      expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    });
  });

  it('redirects invited users to set-password', async () => {
    mockSession(buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    }));
    renderGuard();

    expect(await screen.findByText('Set password page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects invite callback users to set-password', async () => {
    markPendingPasswordSetup();
    mockSession(buildSession());
    renderGuard();

    expect(await screen.findByText('Set password page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects invited users using session user when context user is null', async () => {
    const session = buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockImplementation((cb) => {
      queueMicrotask(() => cb('INITIAL_SESSION', session));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    renderGuard();

    expect(await screen.findByText('Set password page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
