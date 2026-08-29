import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildSession } from '@/test/builders/session';
import { mockSession, mockGetSession, resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
import { clearPendingPasswordSetup, PASSWORD_REQUIREMENTS_MESSAGE } from '@/pages/password/password-helper';
import SetPasswordPage from './SetPasswordPage';

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

describe('SetPasswordPage', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    clearPendingPasswordSetup();
    vi.clearAllMocks();
    supabaseMock.auth.updateUser.mockResolvedValue({ error: null });
  });

  it('renders set-password form for invited users', async () => {
    mockSession(buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    }));

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Plantir' })).toBeInTheDocument();
      expect(screen.getByTestId('brand-logo-mark')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm password/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Set password' })).toBeInTheDocument();
    });
  });

  it('redirects to login when there is no session', async () => {
    mockSession(null);

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { message: 'Invite link expired or invalid.' },
      });
    });
  });

  it('shows loader while session is loading', async () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Set password' })).not.toBeInTheDocument();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('redirects to home when password setup is not required', async () => {
    mockSession(buildSession());

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('submits password and navigates on success', async () => {
    const user = userEvent.setup();
    mockSession(buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    }));

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^Password/), 'Secret123');
    await user.type(screen.getByLabelText(/^Confirm password/), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Set password' }));

    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({
      password: 'Secret123',
      data: { needs_password_setup: false },
    });
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    mockSession(buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    }));

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^Password/), 'Secret123');
    await user.type(screen.getByLabelText(/^Confirm password/), 'different');
    await user.click(screen.getByRole('button', { name: 'Set password' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
  });

  it('shows error on failed update', async () => {
    const user = userEvent.setup();
    vi.mocked(supabaseMock.auth.updateUser).mockResolvedValue({
      error: new Error('Update failed'),
    });
    mockSession(buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    }));

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^Password/), 'Secret123');
    await user.type(screen.getByLabelText(/^Confirm password/), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Set password' }));

    expect(await screen.findByText('Update failed')).toBeInTheDocument();
  });

  it('shows error when password does not meet requirements', async () => {
    const user = userEvent.setup();
    mockSession(buildSession({
      user: {
        id: 'user-1',
        email: 'invited@example.com',
        user_metadata: { needs_password_setup: true },
      },
    }));

    renderWithProviders(<SetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^Password/), 'secret123');
    await user.type(screen.getByLabelText(/^Confirm password/), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Set password' }));

    expect(await screen.findByText(PASSWORD_REQUIREMENTS_MESSAGE)).toBeInTheDocument();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
  });
});
