import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockAuthenticatedUser,
  mockUnauthenticated,
  mockGetSession,
  resetSupabaseMocks,
} from '@/test/mocks/supabase';
import { getSessionUser, requireUser } from './requireUser';

describe('requireUser', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it('returns the session user when authenticated', async () => {
    const user = mockAuthenticatedUser({ id: 'u-42' });
    await expect(requireUser()).resolves.toEqual(user);
    expect(mockGetSession).toHaveBeenCalledOnce();
  });

  it('throws when there is no session', async () => {
    mockUnauthenticated();
    await expect(requireUser()).rejects.toThrow('Not authenticated');
  });
});

describe('getSessionUser', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  it('returns the session user when authenticated', async () => {
    const user = mockAuthenticatedUser({ id: 'u-7' });
    await expect(getSessionUser()).resolves.toEqual(user);
  });

  it('returns null when there is no session', async () => {
    mockUnauthenticated();
    await expect(getSessionUser()).resolves.toBeNull();
  });
});
