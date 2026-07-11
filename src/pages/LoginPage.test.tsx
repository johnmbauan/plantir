import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { mockSession, resetSupabaseMocks, supabaseMock } from '@/test/mocks/supabase';
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
    mockSession(null);
    vi.clearAllMocks();
    supabaseMock.auth.signInWithPassword.mockResolvedValue({ error: null });
  });

  it('renders sign-in form', async () => {
    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Plantir/i })).toBeInTheDocument();
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
});
