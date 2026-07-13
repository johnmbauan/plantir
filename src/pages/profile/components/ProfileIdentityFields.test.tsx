import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { NICKNAME_MAX_LENGTH } from '@/pages/profile/constants';
import ProfileIdentityFields from './ProfileIdentityFields';

describe('ProfileIdentityFields', () => {
  it('renders nickname and email values', () => {
    renderWithProviders(
      <ProfileIdentityFields
        nickname="PlantFan"
        email="user@example.com"
        loading={false}
        onNicknameChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    expect(screen.getByLabelText('Email')).toHaveValue('user@example.com');
  });

  it('disables nickname input while loading', () => {
    renderWithProviders(
      <ProfileIdentityFields
        nickname=""
        email="user@example.com"
        loading
        onNicknameChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Nickname')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('calls onNicknameChange when nickname is edited', async () => {
    const user = userEvent.setup();
    const onNicknameChange = vi.fn();

    renderWithProviders(
      <ProfileIdentityFields
        nickname=""
        email="user@example.com"
        loading={false}
        onNicknameChange={onNicknameChange}
      />,
    );

    await user.type(screen.getByLabelText('Nickname'), 'G');

    expect(onNicknameChange).toHaveBeenCalled();
    expect(onNicknameChange.mock.calls[0]?.[0]).toBe('G');
  });

  it('sets nickname max length from profile constants', () => {
    renderWithProviders(
      <ProfileIdentityFields
        nickname=""
        email="user@example.com"
        loading={false}
        onNicknameChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Nickname')).toHaveAttribute('maxlength', String(NICKNAME_MAX_LENGTH));
  });
});
