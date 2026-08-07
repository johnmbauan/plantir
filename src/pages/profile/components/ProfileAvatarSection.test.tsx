import { createRef, type ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import ProfileAvatarSection from './ProfileAvatarSection';

function renderSection(overrides: Partial<ComponentProps<typeof ProfileAvatarSection>> = {}) {
  const props = {
    previewSrc: null as string | null,
    initials: 'PF',
    avatarFile: null as File | null,
    showRemovePhoto: false,
    loading: false,
    saving: false,
    resetFileRef: createRef<(() => void) | null>(),
    onExpand: vi.fn(),
    onFileChange: vi.fn(),
    onRemovePhoto: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<ProfileAvatarSection {...props} />);
  return props;
}

async function openPhotoMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Edit profile photo' }));
}

describe('ProfileAvatarSection', () => {
  it('shows initials when there is no preview image', () => {
    renderSection({ initials: 'PF' });

    expect(screen.getByText('PF')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View profile photo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit profile photo' })).toBeInTheDocument();
  });

  it('shows upload action in the edit menu when no preview is available', async () => {
    const user = userEvent.setup();
    renderSection();

    await openPhotoMenu(user);

    expect(await screen.findByRole('menuitem', { name: 'Upload photo' })).toBeInTheDocument();
  });

  it('opens the file picker from the upload menu item', async () => {
    const user = userEvent.setup();
    renderSection();

    const fileInput = screen.getByLabelText('Profile photo file');
    const clickSpy = vi.spyOn(fileInput, 'click');

    await openPhotoMenu(user);
    await user.click(await screen.findByRole('menuitem', { name: 'Upload photo' }));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows an expandable avatar and replace action when preview is available', async () => {
    const user = userEvent.setup();
    renderSection({ previewSrc: 'https://cdn/avatar.jpg', showRemovePhoto: true });

    expect(screen.getByRole('button', { name: 'View profile photo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Profile avatar' })).toHaveAttribute(
      'src',
      'https://cdn/avatar.jpg',
    );

    await openPhotoMenu(user);

    expect(await screen.findByRole('menuitem', { name: 'Replace photo' })).toBeInTheDocument();
  });

  it('calls onExpand when the avatar is clicked', async () => {
    const user = userEvent.setup();
    const { onExpand } = renderSection({
      previewSrc: 'https://cdn/avatar.jpg',
      showRemovePhoto: true,
    });

    await user.click(screen.getByRole('button', { name: 'View profile photo' }));

    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('shows remove photo and selected file name when applicable', async () => {
    const user = userEvent.setup();
    const file = new File(['x'], 'new-avatar.jpg', { type: 'image/jpeg' });

    renderSection({
      previewSrc: 'https://cdn/avatar.jpg',
      showRemovePhoto: true,
      avatarFile: file,
    });

    await openPhotoMenu(user);

    expect(await screen.findByRole('menuitem', { name: 'Remove photo' })).toBeInTheDocument();
    expect(screen.getByText('new-avatar.jpg')).toBeInTheDocument();
  });

  it('calls onRemovePhoto when remove is clicked', async () => {
    const user = userEvent.setup();
    const { onRemovePhoto } = renderSection({
      previewSrc: 'https://cdn/avatar.jpg',
      showRemovePhoto: true,
    });

    await openPhotoMenu(user);
    await user.click(await screen.findByRole('menuitem', { name: 'Remove photo' }));

    expect(onRemovePhoto).toHaveBeenCalledOnce();
  });

  it('disables the edit menu while loading or saving', () => {
    renderSection({
      previewSrc: 'https://cdn/avatar.jpg',
      showRemovePhoto: true,
      loading: true,
    });

    expect(screen.getByRole('button', { name: 'Edit profile photo' })).toBeDisabled();
  });

  it('calls onFileChange when a file is selected', async () => {
    const user = userEvent.setup();
    const file = new File(['x'], 'picked.jpg', { type: 'image/jpeg' });
    const { onFileChange } = renderSection();

    await user.upload(screen.getByLabelText('Profile photo file'), file);

    expect(onFileChange).toHaveBeenCalledWith(file);
  });
});
