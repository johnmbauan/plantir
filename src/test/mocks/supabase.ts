import { vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';

type QueryResult = { data: unknown; error: unknown }

function createChain(result: QueryResult = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};

  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'in', 'is', 'gte', 'gt', 'order', 'limit',
    'single', 'maybeSingle',
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }

  chain.then = (onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return chain;
}

const mocks = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockGetSession = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockInvoke = vi.fn();
  const mockStorageFrom = vi.fn();

  function setupFromMocks(handlers: Record<string, QueryResult | QueryResult[]>) {
    const callCounts: Record<string, number> = {};
    mockFrom.mockImplementation((name: string) => {
      const handler = handlers[name];
      if (!handler) return createChain({ data: null, error: null });
      if (Array.isArray(handler)) {
        const index = callCounts[name] ?? 0;
        callCounts[name] = index + 1;
        return createChain(handler[Math.min(index, handler.length - 1)]);
      }
      return createChain(handler);
    });
  }

  const supabaseMock = {
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: mockFrom,
    rpc: mockRpc,
    functions: { invoke: mockInvoke },
    storage: { from: mockStorageFrom },
    realtime: { setAuth: vi.fn() },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb?: (status: string) => void) => {
        cb?.('SUBSCRIBED');
        return 'channel';
      }),
    })),
    removeChannel: vi.fn(),
  };

  function resetSupabaseMocks() {
    mockGetUser.mockReset();
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockInvoke.mockReset();
    mockStorageFrom.mockReset();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  }

  function mockAuthenticatedUser(user: Partial<User> = {}) {
    const fullUser = {
      id: 'user-1',
      email: 'test@example.com',
      ...user,
    } as User;
    mockGetUser.mockResolvedValue({ data: { user: fullUser }, error: null });
    return fullUser;
  }

  function mockUnauthenticated() {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  }

  function mockSessionValue(session: Session | null) {
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockGetUser.mockResolvedValue({
      data: { user: session?.user ?? null },
      error: null,
    });
  }

  function mockFromTable(table: string, result: QueryResult) {
    mockFrom.mockImplementation((name: string) => {
      if (name === table) return createChain(result);
      return createChain({ data: null, error: null });
    });
  }

  function mockFromSequence(table: string, results: QueryResult[]) {
    let callIndex = 0;
    mockFrom.mockImplementation((name: string) => {
      if (name === table) {
        const result = results[Math.min(callIndex, results.length - 1)];
        callIndex += 1;
        return createChain(result);
      }
      return createChain({ data: null, error: null });
    });
  }

  return {
    mockGetUser,
    mockGetSession,
    mockOnAuthStateChange,
    mockFrom,
    mockRpc,
    mockInvoke,
    mockStorageFrom,
    supabaseMock,
    resetSupabaseMocks,
    mockAuthenticatedUser,
    mockUnauthenticated,
    mockSession: mockSessionValue,
    mockFromTable,
    mockFromSequence,
    createQueryChain: createChain,
    setupFromMocks,
  };
});

vi.mock('@/supabase', () => ({ default: mocks.supabaseMock }));

export const {
  mockGetUser,
  mockGetSession,
  mockOnAuthStateChange,
  mockFrom,
  mockRpc,
  mockInvoke,
  mockStorageFrom,
  supabaseMock,
  resetSupabaseMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  mockSession,
  mockFromTable,
  mockFromSequence,
  createQueryChain,
  setupFromMocks,
} = mocks;
