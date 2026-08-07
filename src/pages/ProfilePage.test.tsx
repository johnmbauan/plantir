import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';
import { useProfile } from '@/context/ProfileContext';
import ProfilePage from './ProfilePage';

function ProfileContextProbe() {
  const { nickname, avatarUrl } = useProfile();
  return (
    <div>
      <span data-testid="shared-nickname">{nickname}</span>
      <span data-testid="shared-avatar">{avatarUrl}</span>
    </div>
  );
}

const fetchProfile = vi.fn();
const upsertProfile = vi.fn();
const uploadAvatar = vi.fn();
const deleteAvatar = vi.fn();

vi.mock('@/context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/AuthContext')>();
  const { buildSession } = await import('@/test/builders/session');
  return {
    ...actual,
    useAuth: () => ({
      session: buildSession(),
      loading: false,
    }),
  };
});

vi.mock('@/services/profileService', () => ({
  fetchProfile: (...args: unknown[]) => fetchProfile(...args),
  upsertProfile: (...args: unknown[]) => upsertProfile(...args),
  uploadAvatar: (...args: unknown[]) => uploadAvatar(...args),
  deleteAvatar: (...args: unknown[]) => deleteAvatar(...args),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchProfile.mockResolvedValue({
      nickname: 'PlantFan',
      avatar_url: 'https://cdn/avatar.jpg',
    });
    upsertProfile.mockResolvedValue(undefined);
    uploadAvatar.mockResolvedValue('https://cdn/new-avatar.jpg');
    deleteAvatar.mockResolvedValue(undefined);
  });

  it('renders profile form after loading', async () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
      expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    });
  });

  it('saves updated nickname on submit', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    });

    await user.clear(screen.getByLabelText('Nickname'));
    await user.type(screen.getByLabelText('Nickname'), 'GreenThumb');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsertProfile).toHaveBeenCalledWith('GreenThumb', 'https://cdn/avatar.jpg');
    });
  });

  it('loads profile once through shared context', async () => {
    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    });

    expect(fetchProfile).toHaveBeenCalledTimes(1);
  });

  it('updates shared profile context after a successful save', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <ProfilePage />
        <ProfileContextProbe />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
      expect(screen.getByTestId('shared-nickname')).toHaveTextContent('PlantFan');
    });

    await user.clear(screen.getByLabelText('Nickname'));
    await user.type(screen.getByLabelText('Nickname'), 'GreenThumb');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByTestId('shared-nickname')).toHaveTextContent('GreenThumb');
      expect(screen.getByTestId('shared-avatar')).toHaveTextContent('https://cdn/avatar.jpg');
    });
    expect(fetchProfile).toHaveBeenCalledTimes(1);
  });

  it('shows error when fetchProfile fails', async () => {
    const { notifications } = await import('@mantine/notifications');
    fetchProfile.mockRejectedValue(new Error('Load failed'));

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', message: 'Load failed' }),
      );
    });
  });

  it('shows error when save fails', async () => {
    const user = userEvent.setup();
    const { notifications } = await import('@mantine/notifications');
    upsertProfile.mockRejectedValue(new Error('Save failed'));

    renderWithProviders(<ProfilePage />);

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

  it('opens expanded profile photo when avatar is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ProfilePage />);

    await user.click(await screen.findByRole('button', { name: 'View profile photo' }));

    expect(await screen.findByRole('dialog', { name: 'Profile photo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Profile photo enlarged' })).toHaveAttribute(
      'src',
      'https://cdn/avatar.jpg',
    );

    const dialog = screen.getByRole('dialog', { name: 'Profile photo' });
    await user.click(within(dialog).getByRole('button'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Profile photo' })).not.toBeInTheDocument();
    });
  });

  it('does not offer photo expansion when no avatar is set', async () => {
    fetchProfile.mockResolvedValue({ nickname: 'PlantFan', avatar_url: null });

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    });

    expect(screen.queryByRole('button', { name: 'View profile photo' })).not.toBeInTheDocument();
  });

  it('deletes the previous avatar only after a successful replace save', async () => {
    const user = userEvent.setup();
    const file = new File(['x'], 'new-avatar.jpg', { type: 'image/jpeg' });

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    });

    await user.upload(screen.getByLabelText('Profile photo file'), file);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(uploadAvatar).toHaveBeenCalledWith(file);
      expect(upsertProfile).toHaveBeenCalledWith('PlantFan', 'https://cdn/new-avatar.jpg');
      expect(deleteAvatar).toHaveBeenCalledWith('https://cdn/avatar.jpg');
    });

    expect(uploadAvatar.mock.invocationCallOrder[0]).toBeLessThan(
      upsertProfile.mock.invocationCallOrder[0],
    );
    expect(upsertProfile.mock.invocationCallOrder[0]).toBeLessThan(
      deleteAvatar.mock.invocationCallOrder[0],
    );
  });

  it('deletes the previous avatar only after removing the photo and saving', async () => {
    const user = userEvent.setup();

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    });

    await user.click(screen.getByRole('button', { name: 'Edit profile photo' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove photo' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(upsertProfile).toHaveBeenCalledWith('PlantFan', null);
      expect(deleteAvatar).toHaveBeenCalledWith('https://cdn/avatar.jpg');
    });

    expect(uploadAvatar).not.toHaveBeenCalled();
    expect(upsertProfile.mock.invocationCallOrder[0]).toBeLessThan(
      deleteAvatar.mock.invocationCallOrder[0],
    );
  });

  it('does not delete the previous avatar when save fails after upload', async () => {
    const user = userEvent.setup();
    const file = new File(['x'], 'new-avatar.jpg', { type: 'image/jpeg' });
    upsertProfile.mockRejectedValue(new Error('Save failed'));

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nickname')).toHaveValue('PlantFan');
    });

    await user.upload(screen.getByLabelText('Profile photo file'), file);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(uploadAvatar).toHaveBeenCalledWith(file);
    });

    expect(deleteAvatar).not.toHaveBeenCalled();
  });
});
