import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { mockSession, resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import { clearPendingPasswordSetup } from '@/pages/password/password-helper';
import ForgotPasswordPage from './ForgotPasswordPage';

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

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    clearPendingPasswordSetup();
    mockSession(null);
    vi.clearAllMocks();
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it('renders forgot-password form', async () => {
    renderWithProviders(<ForgotPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Plantir/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
    });
  });

  it('submits email and shows confirmation message', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    expect(await screen.findByText(/If an account exists for that email/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument();
  });

  it('shows error message on failed request', async () => {
    const user = userEvent.setup();
    vi.mocked(supabaseMock.auth.resetPasswordForEmail).mockResolvedValue({
      error: new Error('Rate limit exceeded'),
    });

    renderWithProviders(<ForgotPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Rate limit exceeded')).toBeInTheDocument();
  });

  it('redirects authenticated users to home', async () => {
    mockSession(buildSession());

    renderWithProviders(<ForgotPasswordPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/', { replace: true });
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

    renderWithProviders(<ForgotPasswordPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/set-password', { replace: true });
    });
  });
});
