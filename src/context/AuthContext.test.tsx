import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  resetSupabaseMocks,
  mockSession,
  mockGetUser,
  mockOnAuthStateChange,
} from '@/test/mocks/supabase';
import { buildSession, buildUser } from '@/test/builders/session';
import { AuthProvider, useAuth } from './AuthContext';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it('loads the initial session from onAuthStateChange', async () => {
    const session = buildSession();
    mockSession(session);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(session);
    expect(result.current.user).toEqual(session.user);
  });

  it('starts with no session when INITIAL_SESSION is null', async () => {
    mockSession(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('falls back to session user when getUser fails', async () => {
    const session = buildSession({ user: buildUser({ email: 'fallback@example.com' }) });
    mockSession(session);
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('fetch failed'),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(session);
    expect(result.current.user).toEqual(session.user);
  });

  it('updates session when auth state changes', async () => {
    mockSession(null);

    let authCallback: (event: string, session: Session | null) => void = () => {};
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      queueMicrotask(() => cb('INITIAL_SESSION', null));
      return { data: { subscription: { unsubscribe } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGetUser.mockClear();
    const newSession = buildSession({ user: buildUser({ email: 'signed-in@example.com' }) });
    await act(async () => {
      mockSession(newSession);
      authCallback('SIGNED_IN', newSession);
    });

    await waitFor(() => {
      expect(result.current.session).toEqual(newSession);
      expect(result.current.user).toEqual(newSession.user);
    });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('clears session when auth state changes to signed out', async () => {
    const session = buildSession();
    mockSession(session);

    let authCallback: (event: string, session: Session | null) => void = () => {};
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      queueMicrotask(() => cb('INITIAL_SESSION', session));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(session));

    act(() => {
      authCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  it('unsubscribes from auth changes on unmount', async () => {
    mockSession(null);

    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
