import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  resetSupabaseMocks,
  mockSession,
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

  it('loads the initial session from getSession', async () => {
    const session = buildSession();
    mockSession(session);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(session);
  });

  it('starts with no session when getSession returns null', async () => {
    mockSession(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it('updates session when auth state changes', async () => {
    mockSession(null);

    let authCallback: (event: string, session: Session | null) => void = () => {};
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newSession = buildSession({ user: buildUser({ email: 'signed-in@example.com' }) });
    act(() => {
      authCallback('SIGNED_IN', newSession);
    });

    expect(result.current.session).toEqual(newSession);
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
