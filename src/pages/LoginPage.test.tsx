import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { mockSession, resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import { clearPendingPasswordSetup } from '@/pages/password/password-helper';
import LoginPage from './LoginPage';

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

describe('LoginPage', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    clearPendingPasswordSetup();
    mockSession(null);
    vi.clearAllMocks();
    supabaseMock.auth.signInWithPassword.mockResolvedValue({ error: null });
  });

  it('renders sign-in form', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Plantir' })).toBeInTheDocument();
      expect(screen.getByTestId('brand-logo-mark')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
  });

  it('submits credentials and navigates on success', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret',
    });
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows error message on failed sign-in', async () => {
    const user = userEvent.setup();
    vi.mocked(supabaseMock.auth.signInWithPassword).mockResolvedValue({
      error: new Error('Invalid credentials'),
    });

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    });

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('redirects authenticated users to home', async () => {
    mockSession(buildSession());

    renderWithProviders(<LoginPage />);

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

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/set-password', { replace: true });
    });
  });

  it('shows invite message from navigation state', async () => {
    renderWithProviders(<LoginPage />, {
      routerProps: {
        initialEntries: [{
          pathname: '/login',
          state: { message: 'Invite link expired or invalid.' },
        }],
      },
    });

    expect(await screen.findByText('Invite link expired or invalid.')).toBeInTheDocument();
  });

  it('links to forgot-password page', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
    });
  });
});
