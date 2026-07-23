import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildSession } from '@/test/builders/session';
import { mockSession, mockGetSession, resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
import { clearPendingPasswordSetup, PASSWORD_REQUIREMENTS_MESSAGE } from '@/pages/password/password-helper';
import ResetPasswordPage from './ResetPasswordPage';

const { navigate } = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    clearPendingPasswordSetup();
    vi.clearAllMocks();
    supabaseMock.auth.updateUser.mockResolvedValue({ error: null });
    supabaseMock.auth.signOut.mockResolvedValue({ error: null });
  });

  it('renders reset-password form for recovery sessions', async () => {
    mockSession(buildSession());

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Plantir/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm new password/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset password' })).toBeInTheDocument();
    });
  });

  it('redirects to login when there is no session', async () => {
    mockSession(null);

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { message: 'Recovery link expired or invalid.' },
      });
    });
  });

  it('shows loader while session is loading', async () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument();
      expect(navigate).not.toHaveBeenCalled();
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

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/set-password', { replace: true });
    });
  });

  it('submits password, signs out, and navigates to login on success', async () => {
    const user = userEvent.setup();
    mockSession(buildSession());

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^New password/), 'Secret123');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: 'Secret123' });
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { message: 'Password updated. Sign in with your new password.' },
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    mockSession(buildSession());

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^New password/), 'Secret123');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'different');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
  });

  it('shows error on failed update', async () => {
    const user = userEvent.setup();
    vi.mocked(supabaseMock.auth.updateUser).mockResolvedValue({
      error: new Error('Update failed'),
    });
    mockSession(buildSession());

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^New password/), 'Secret123');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Update failed')).toBeInTheDocument();
  });

  it('shows error when password does not meet requirements', async () => {
    const user = userEvent.setup();
    mockSession(buildSession());

    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^New password/), 'secret123');
    await user.type(screen.getByLabelText(/^Confirm new password/), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText(PASSWORD_REQUIREMENTS_MESSAGE)).toBeInTheDocument();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
  });
});
