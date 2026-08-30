import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { TelegramChatIdField } from './TelegramChatIdField';

const mockUseTelegramChatLookup = vi.fn();

vi.mock('@/hooks/useTelegramChatLookup', () => ({
  useTelegramChatLookup: (...args: unknown[]) => mockUseTelegramChatLookup(...args),
}));

describe('TelegramChatIdField', () => {
  it('renders the Chat ID text input', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'idle' });
    renderWithProviders(<TelegramChatIdField value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Telegram Chat ID')).toBeInTheDocument();
  });

  it('calls onChange when the user types', async () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'idle' });
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<TelegramChatIdField value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Telegram Chat ID'), '1');

    expect(onChange).toHaveBeenCalled();
  });

  it('shows nothing extra when idle', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'idle' });
    renderWithProviders(<TelegramChatIdField value="" onChange={vi.fn()} />);
    expect(screen.queryByText('Verifying…')).not.toBeInTheDocument();
  });

  it('shows loading indicator while verifying', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'loading' });
    renderWithProviders(<TelegramChatIdField value="123456789" onChange={vi.fn()} />);
    expect(screen.getByText('Verifying…')).toBeInTheDocument();
  });

  it('shows personal account label and full name on success', () => {
    mockUseTelegramChatLookup.mockReturnValue({
      status: 'success',
      info: { type: 'private', firstName: 'John', lastName: 'Doe', username: 'johndoe' },
    });
    renderWithProviders(<TelegramChatIdField value="123456789" onChange={vi.fn()} />);
    expect(screen.getByText('Personal account ·')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  it('shows group label and title on success', () => {
    mockUseTelegramChatLookup.mockReturnValue({
      status: 'success',
      info: { type: 'group', title: 'Garden Club' },
    });
    renderWithProviders(<TelegramChatIdField value="-100123456789" onChange={vi.fn()} />);
    expect(screen.getByText('Group ·')).toBeInTheDocument();
    expect(screen.getByText('Garden Club')).toBeInTheDocument();
  });

  it('uses group label for supergroup type', () => {
    mockUseTelegramChatLookup.mockReturnValue({
      status: 'success',
      info: { type: 'supergroup', title: 'Plant Lovers', username: 'plantlovers' },
    });
    renderWithProviders(<TelegramChatIdField value="-1001234567890" onChange={vi.fn()} />);
    expect(screen.getByText('Group ·')).toBeInTheDocument();
    expect(screen.getByText('Plant Lovers')).toBeInTheDocument();
    expect(screen.getByText('@plantlovers')).toBeInTheDocument();
  });

  it('uses group label for channel type', () => {
    mockUseTelegramChatLookup.mockReturnValue({
      status: 'success',
      info: { type: 'channel', title: 'Garden Updates' },
    });
    renderWithProviders(<TelegramChatIdField value="-100444555666" onChange={vi.fn()} />);
    expect(screen.getByText('Group ·')).toBeInTheDocument();
    expect(screen.getByText('Garden Updates')).toBeInTheDocument();
  });

  it('shows first name only when last name is missing', () => {
    mockUseTelegramChatLookup.mockReturnValue({
      status: 'success',
      info: { type: 'private', firstName: 'Alice' },
    });
    renderWithProviders(<TelegramChatIdField value="111222333" onChange={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('@')).not.toBeInTheDocument();
  });

  it('shows not-found error when errorCode is chat_not_found', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'error', errorCode: 'chat_not_found' });
    renderWithProviders(<TelegramChatIdField value="999999999" onChange={vi.fn()} />);
    expect(screen.getByText(/Chat ID not found/)).toBeInTheDocument();
  });

  it('shows bot-not-in-chat error when errorCode is bot_not_in_chat', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'error', errorCode: 'bot_not_in_chat' });
    renderWithProviders(<TelegramChatIdField value="-100123456789" onChange={vi.fn()} />);
    expect(screen.getByText(/The Plantir bot is not in this group/)).toBeInTheDocument();
  });

  it('shows generic error for unknown error codes', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'error', errorCode: 'telegram_error' });
    renderWithProviders(<TelegramChatIdField value="123456789" onChange={vi.fn()} />);
    expect(screen.getByText(/Could not verify/)).toBeInTheDocument();
  });

  it('shows generic error for invalid_chat_id', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'error', errorCode: 'invalid_chat_id' });
    renderWithProviders(<TelegramChatIdField value="abc" onChange={vi.fn()} />);
    expect(screen.getByText(/Could not verify/)).toBeInTheDocument();
  });

  it('disables the input when disabled prop is set', () => {
    mockUseTelegramChatLookup.mockReturnValue({ status: 'idle' });
    renderWithProviders(<TelegramChatIdField value="" onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Telegram Chat ID')).toBeDisabled();
  });
});
