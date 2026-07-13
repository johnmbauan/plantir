import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within } from '@/test/render';
import ProfilePhotoModal from './ProfilePhotoModal';

describe('ProfilePhotoModal', () => {
  it('shows enlarged profile photo when opened', () => {
    renderWithProviders(
      <ProfilePhotoModal
        opened
        onClose={vi.fn()}
        src="https://cdn/avatar.jpg"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Profile photo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Profile photo enlarged' })).toHaveAttribute(
      'src',
      'https://cdn/avatar.jpg',
    );
  });

  it('calls onClose when the modal is dismissed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <ProfilePhotoModal
        opened
        onClose={onClose}
        src="https://cdn/avatar.jpg"
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Profile photo' });
    await user.click(within(dialog).getByRole('button'));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
