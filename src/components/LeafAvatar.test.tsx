import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import LeafAvatar from '@/components/LeafAvatar';
import {
  HEADER_AVATAR_HEIGHT,
  HEADER_AVATAR_WIDTH,
  PROFILE_AVATAR_HEIGHT,
  PROFILE_AVATAR_WIDTH,
} from '@/pages/profile/leafShape';

describe('LeafAvatar', () => {
  it('shows initials when there is no image', () => {
    renderWithProviders(<LeafAvatar alt="Profile avatar" initials="PF" />);

    expect(screen.getByText('PF')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Profile avatar' })).not.toBeInTheDocument();
  });

  it('shows the image when src is provided', () => {
    renderWithProviders(
      <LeafAvatar alt="Profile avatar" src="https://cdn/avatar.jpg" initials="PF" />,
    );

    expect(screen.getByRole('img', { name: 'Profile avatar' })).toHaveAttribute(
      'src',
      'https://cdn/avatar.jpg',
    );
  });

  it('renders a green leaf border at the default profile size', () => {
    renderWithProviders(<LeafAvatar alt="Profile avatar" initials="PF" />);

    const border = screen.getByTestId('profile-leaf-border');
    expect(border).toHaveStyle({
      background: 'var(--green-500)',
      width: `${PROFILE_AVATAR_WIDTH}px`,
      height: `${PROFILE_AVATAR_HEIGHT}px`,
    });
  });

  it('renders at header size when requested', () => {
    renderWithProviders(<LeafAvatar size="header" alt="Your profile" initials="PF" />);

    expect(screen.getByTestId('profile-leaf-border')).toHaveStyle({
      width: `${HEADER_AVATAR_WIDTH}px`,
      height: `${HEADER_AVATAR_HEIGHT}px`,
    });
  });

  it('becomes clickable when onClick is provided', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <LeafAvatar
        alt="Profile avatar"
        src="https://cdn/avatar.jpg"
        onClick={onClick}
        clickAriaLabel="View profile photo"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'View profile photo' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not render a click target without onClick', () => {
    renderWithProviders(<LeafAvatar alt="Profile avatar" initials="PF" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders overlay children relative to the leaf frame', () => {
    renderWithProviders(
      <LeafAvatar alt="Profile avatar" initials="PF">
        <button type="button">Edit</button>
      </LeafAvatar>,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });
});
