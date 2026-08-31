import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { buildSession } from '@/test/builders/session';
import { mockSession, resetSupabaseMocks } from '@/test/mocks/supabase';
import supabase from '@/supabase';
import UserMenu from '@/components/UserMenu';
import { EMPTY_ONBOARDING } from '@/services/onboardingService';

const fetchProfile = vi.fn();
const fetchOnboarding = vi.fn();
const restoreOnboarding = vi.fn();

vi.mock('@/services/profileService', () => ({
  fetchProfile: (...args: unknown[]) => fetchProfile(...args),
}));

vi.mock('@/services/onboardingService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/onboardingService')>();
  return {
    ...actual,
    fetchOnboarding: (...args: unknown[]) => fetchOnboarding(...args),
    restoreOnboarding: (...args: unknown[]) => restoreOnboarding(...args),
  };
});

function renderUserMenu(route = '/dashboard') {
  return renderWithProviders(
    <>
      <UserMenu />
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/profile" element={<div>Profile page</div>} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </>,
    { route },
  );
}

describe('UserMenu', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSession(buildSession());
    fetchProfile.mockResolvedValue({ nickname: 'Plant Fan', avatar_url: null });
    fetchOnboarding.mockResolvedValue({ ...EMPTY_ONBOARDING });
    restoreOnboarding.mockResolvedValue(undefined);
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

  it('does not show Get started when setup is still open', async () => {
    const user = userEvent.setup();
    renderUserMenu();

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Get started' })).not.toBeInTheDocument();
  });

  it('shows Get started after dismiss when setup is incomplete', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      dismissedAt: '2026-08-30T00:00:00Z',
    });
    const user = userEvent.setup();
    renderUserMenu();

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    expect(await screen.findByRole('menuitem', { name: 'Get started' })).toBeInTheDocument();
  });

  it('does not show Get started when setup is complete even if dismissed', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      completedPlantsAt: '2026-08-01T00:00:00Z',
      completedDevicesAt: '2026-08-01T00:00:00Z',
      completedLocationAt: '2026-08-01T00:00:00Z',
      completedNotificationsAt: '2026-08-01T00:00:00Z',
      dismissedAt: '2026-08-30T00:00:00Z',
    });
    const user = userEvent.setup();
    renderUserMenu();

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Get started' })).not.toBeInTheDocument();
  });

  it('restores onboarding and goes to the dashboard', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      dismissedAt: '2026-08-30T00:00:00Z',
    });
    const user = userEvent.setup();
    renderUserMenu('/profile');

    await user.hover(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Get started' }));

    await waitFor(() => {
      expect(restoreOnboarding).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
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
      avatar_url: 'https://x.supabase.co/storage/v1/object/public/avatars/user/abc.jpg',
    });
    renderUserMenu();

    expect(await screen.findByRole('img', { name: 'Your profile' })).toHaveAttribute(
      'src',
      'https://x.supabase.co/storage/v1/object/public/avatars/user/abc_thumb.jpg',
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
