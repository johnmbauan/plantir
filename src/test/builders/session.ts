import type { Session, User } from '@supabase/supabase-js'

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User
}

export function buildSession(overrides: Partial<Session> = {}): Session {
  const user = buildUser(overrides.user ?? {})
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user,
    ...overrides,
  }
}
