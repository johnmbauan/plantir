import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildSession } from '@/test/builders/session';
import { mockSession, resetSupabaseMocks } from '@/test/mocks/supabase';
import supabase from '@/supabase';
import UserMenu from '@/components/UserMenu';

const fetchProfile = vi.fn();

vi.mock('@/services/profileService', () => ({
  fetchProfile: (...args: unknown[]) => fetchProfile(...args),
}));

function renderUserMenu(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<UserMenu />} />
      <Route path="/profile" element={<div>Profile page</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { route },
  );
}

describe('UserMenu', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSession(buildSession());
    fetchProfile.mockResolvedValue({ nickname: 'Plant Fan', avatar_url: null });
    Object.assign(supabase.auth, {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it('shows avatar initials from profile nickname', async () => {
    renderUserMenu();

    expect(await screen.findByRole('button', { name: 'Account menu' })).toBeInTheDocument();
    expect(await screen.findByText('PF')).toBeInTheDocument();
    expect(fetchProfile).toHaveBeenCalledTimes(1);
  });

  it('navigates to profile from the menu', async () => {
    const user = userEvent.setup();
    renderUserMenu();

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Profile' }));

    expect(await screen.findByText('Profile page')).toBeInTheDocument();
  });

  it('signs out from the menu', async () => {
    const user = userEvent.setup();
    renderUserMenu();

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    });
    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('does not navigate when sign out fails', async () => {
    Object.assign(supabase.auth, {
      signOut: vi.fn().mockResolvedValue({ error: { message: 'Sign out failed' } }),
    });
    const user = userEvent.setup();
    renderUserMenu();

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('shows profile avatar image when avatar_url is set', async () => {
    fetchProfile.mockResolvedValue({
      nickname: 'Plant Fan',
      avatar_url: 'https://cdn/avatar.jpg',
    });
    renderUserMenu();

    expect(await screen.findByRole('img', { name: 'Your profile' })).toHaveAttribute(
      'src',
      'https://cdn/avatar.jpg',
    );
  });

  it('falls back to email initials when profile is missing', async () => {
    fetchProfile.mockResolvedValue(null);
    renderUserMenu();

    expect(await screen.findByText('TE')).toBeInTheDocument();
  });

  it('falls back to email initials when profile load fails', async () => {
    fetchProfile.mockRejectedValue(new Error('Load failed'));
    renderUserMenu();

    expect(await screen.findByText('TE')).toBeInTheDocument();
  });
});
