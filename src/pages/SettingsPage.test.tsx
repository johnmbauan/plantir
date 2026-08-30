import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import SettingsPage from './SettingsPage';

const fetchSettings = vi.fn();
const upsertSettings = vi.fn();
const markOnboardingStepComplete = vi.fn();

vi.mock('@/services/notificationService', () => ({
  fetchSettings: (...args: unknown[]) => fetchSettings(...args),
  upsertSettings: (...args: unknown[]) => upsertSettings(...args),
}));

vi.mock('@/services/onboardingService', () => ({
  markOnboardingStepComplete: (...args: unknown[]) => markOnboardingStepComplete(...args),
}));

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
    fetchSettings.mockResolvedValue({
      browser_notifications_enabled: true,
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
      expect(screen.getByLabelText('Telegram Chat ID')).toHaveValue('12345');
    });
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
      expect(upsertSettings).toHaveBeenCalledWith('99999', 9, 'Europe/Rome', true);
      expect(markOnboardingStepComplete).toHaveBeenCalledWith('notifications');
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

  it('toggles in-app notifications switch', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const toggle = await screen.findByRole('switch', { name: /In-app notifications/i });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
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
      expect(upsertSettings).toHaveBeenCalledWith('12345', 10, 'Europe/London', true);
    });
  });
});
