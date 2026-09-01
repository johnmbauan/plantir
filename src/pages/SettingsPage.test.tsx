import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildSession, buildUser } from '@/test/builders/session';
import SettingsPage from './SettingsPage';

const fetchSettings = vi.fn();
const upsertSettings = vi.fn();
const markOnboardingStepComplete = vi.fn();

const { mockSetLocale, mockUseAuth } = vi.hoisted(() => ({
  mockSetLocale: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/services/notificationService', () => ({
  fetchSettings: (...args: unknown[]) => fetchSettings(...args),
  upsertSettings: (...args: unknown[]) => upsertSettings(...args),
}));

vi.mock('@/services/onboardingService', () => ({
  markOnboardingStepComplete: (...args: unknown[]) => markOnboardingStepComplete(...args),
}));

vi.mock('@/context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/AuthContext')>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('@/context/LanguageContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/LanguageContext')>();
  return {
    ...actual,
    useLanguage: () => ({ locale: 'en' as const, setLocale: mockSetLocale }),
  };
});

vi.mock('@/components/TelegramSetupAccordion', () => ({
  default: () => <div>Telegram setup instructions</div>,
}));

vi.mock('@/components/TelegramChatIdField', () => ({
  TelegramChatIdField: ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
    <input
      aria-label="Telegram Chat ID"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled}
    />
  ),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      session: buildSession(),
      user: buildSession().user,
      loading: false,
    });
    mockSetLocale.mockResolvedValue(undefined);
    fetchSettings.mockResolvedValue({
      browser_notifications_enabled: true,
      email_notifications_enabled: false,
      telegram_chat_id: '12345',
      notification_hour: 9,
      notification_timezone: 'Europe/Rome',
    });
    upsertSettings.mockResolvedValue(undefined);
    markOnboardingStepComplete.mockResolvedValue({ newlyCompleted: true, dismissed: false });
  });

  it('renders settings form after loading', async () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /In-app notifications/i })).toBeChecked();
      expect(screen.getByRole('switch', { name: /Email notifications/i })).not.toBeChecked();
      expect(screen.getByLabelText('Telegram Chat ID')).toHaveValue('12345');
    });
    expect(screen.getByText('A daily digest is sent to test@example.com.')).toBeInTheDocument();
  });

  it('shows a generic email description when the account has no email', async () => {
    mockUseAuth.mockReturnValue({
      session: buildSession({ user: buildUser({ email: undefined }) }),
      user: buildUser({ email: undefined }),
      loading: false,
    });

    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByText('A daily digest is sent to your account email.'),
    ).toBeInTheDocument();
  });

  it('saves updated settings on submit', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Telegram Chat ID')).toHaveValue('12345');
    });

    await user.clear(screen.getByLabelText('Telegram Chat ID'));
    await user.type(screen.getByLabelText('Telegram Chat ID'), '99999');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsertSettings).toHaveBeenCalledWith('99999', 9, 'Europe/Rome', true, false);
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('notifications');
    });
  });

  it('saves email notifications when the switch is turned on', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const emailToggle = await screen.findByRole('switch', { name: /Email notifications/i });
    await user.click(emailToggle);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsertSettings).toHaveBeenCalledWith('12345', 9, 'Europe/Rome', true, true);
    });
  });

  it('shows error when fetchSettings fails', async () => {
    const { notifications } = await import('@mantine/notifications');
    fetchSettings.mockRejectedValue(new Error('Load failed'));

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Load failed' }),
      );
    });
  });

  it('shows error when save fails', async () => {
    const user = userEvent.setup();
    const { notifications } = await import('@mantine/notifications');
    upsertSettings.mockRejectedValue(new Error('Save failed'));

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Save failed' }),
      );
    });
  });

  it('logs when recording the onboarding step fails after a successful save', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    markOnboardingStepComplete.mockRejectedValue(new Error('onboarding failed'));

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsertSettings).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to record onboarding notifications step:',
        expect.any(Error),
      );
    });

    errorSpy.mockRestore();
  });

  it('toggles in-app notifications switch', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const toggle = await screen.findByRole('switch', { name: /In-app notifications/i });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(toggle).not.toBeChecked();

    const emailToggle = screen.getByRole('switch', { name: /Email notifications/i });
    expect(emailToggle).not.toBeChecked();

    await user.click(emailToggle);

    expect(emailToggle).toBeChecked();
  });

  it('updates the language', async () => {
    const user = userEvent.setup();
    const { notifications } = await import('@mantine/notifications');

    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByText('IT'));

    await waitFor(() => {
      expect(mockSetLocale).toHaveBeenCalledWith('it');
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Lingua aggiornata',
          message: "La lingua dell'interfaccia è stata cambiata in italiano.",
        }),
      );
    });
  });

  it('shows an error when updating the language fails', async () => {
    const user = userEvent.setup();
    const { notifications } = await import('@mantine/notifications');
    mockSetLocale.mockRejectedValue(new Error('locale failed'));

    renderWithProviders(<SettingsPage />);

    await user.click(screen.getByText('IT'));

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'locale failed' }),
      );
    });
  });

  it('updates notification hour and timezone selects', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    await user.click(screen.getByRole('textbox', { name: 'Notification time' }));
    await user.click(await screen.findByText('10:00'));

    await user.click(screen.getByRole('textbox', { name: 'Timezone' }));
    await user.click(await screen.findByText('Europe/London'));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsertSettings).toHaveBeenCalledWith('12345', 10, 'Europe/London', true, false);
    });
  });
});
