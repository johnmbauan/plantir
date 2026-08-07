import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { buildSession, buildUser } from '@/test/builders/session';
import { ProfileProvider, useProfile } from './ProfileContext';

const mockFetchProfile = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/services/profileService', () => ({
  fetchProfile: (...args: unknown[]) => mockFetchProfile(...args),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}

describe('ProfileContext', () => {
  beforeEach(() => {
    mockFetchProfile.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ session: buildSession(), loading: false });
    mockFetchProfile.mockResolvedValue({
      nickname: 'Plant Fan',
      avatar_url: 'https://cdn/avatar.jpg',
    });
  });

  it('loads profile when a session is present', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.nickname).toBe('Plant Fan');
    expect(result.current.avatarUrl).toBe('https://cdn/avatar.jpg');
    expect(result.current.error).toBeNull();
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('clears profile when there is no session', async () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nickname).toBeNull();
    expect(result.current.avatarUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('exposes null fields when profile row is missing', async () => {
    mockFetchProfile.mockResolvedValue(null);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nickname).toBeNull();
    expect(result.current.avatarUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets error when profile fetch fails', async () => {
    mockFetchProfile.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Load failed');
    expect(result.current.nickname).toBeNull();
    expect(result.current.avatarUrl).toBeNull();
  });

  it('updates local profile without refetching', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setLocalProfile({
        nickname: 'Green Thumb',
        avatar_url: 'https://cdn/new.jpg',
      });
    });

    expect(result.current.nickname).toBe('Green Thumb');
    expect(result.current.avatarUrl).toBe('https://cdn/new.jpg');
    expect(result.current.error).toBeNull();
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('clears a previous error when setLocalProfile is called', async () => {
    mockFetchProfile.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe('Load failed'));

    act(() => {
      result.current.setLocalProfile({ nickname: 'Recovered', avatar_url: null });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.nickname).toBe('Recovered');
  });

  it('refetches when the signed-in user changes', async () => {
    const { result, rerender } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.nickname).toBe('Plant Fan'));
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);

    mockFetchProfile.mockResolvedValue({
      nickname: 'Other User',
      avatar_url: null,
    });
    mockUseAuth.mockReturnValue({
      session: buildSession({ user: buildUser({ id: 'user-2' }) }),
      loading: false,
    });
    rerender();

    await waitFor(() => expect(result.current.nickname).toBe('Other User'));
    expect(mockFetchProfile).toHaveBeenCalledTimes(2);
  });

  it('clears profile when the user signs out', async () => {
    const { result, rerender } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.nickname).toBe('Plant Fan'));

    mockUseAuth.mockReturnValue({ session: null, loading: false });
    rerender();

    await waitFor(() => {
      expect(result.current.nickname).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('ignores stale fetch results after unmount', async () => {
    let resolveFetch: (value: { nickname: string; avatar_url: string | null }) => void = () => undefined;
    mockFetchProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { result, unmount } = renderHook(() => useProfile(), { wrapper });
    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      resolveFetch({ nickname: 'Stale', avatar_url: null });
    });

    // Hook unmounted; no throw and no further state updates expected.
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('ignores stale fetch errors after unmount', async () => {
    let rejectFetch: (reason?: unknown) => void = () => undefined;
    mockFetchProfile.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectFetch = reject;
      }),
    );

    const { unmount } = renderHook(() => useProfile(), { wrapper });
    unmount();

    await act(async () => {
      rejectFetch(new Error('stale failure'));
    });

    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('throws when used outside ProfileProvider', () => {
    expect(() => renderHook(() => useProfile())).toThrow(
      'useProfile must be used within ProfileProvider',
    );
  });
});
