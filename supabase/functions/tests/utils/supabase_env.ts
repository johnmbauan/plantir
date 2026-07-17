/**
 * Shared test utilities for edge function integration tests.
 *
 * Pattern (per test file):
 *   1. Call interceptServe() BEFORE the dynamic import to capture the handler.
 *   2. await import("../../my-function/index.ts") — triggers Deno.serve.
 *   3. Call intercept.restore() and intercept.getHandler() to get the handler.
 *   4. Stub Deno.env.get via stubEnv() so env var reads inside the handler resolve correctly.
 *   5. Per test: stub globalThis.fetch via routedFetch() to simulate Supabase REST + external APIs.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TEST_SUPABASE_URL = "https://test.supabase.co";
export const TEST_ANON_KEY = "test-anon-key";
export const TEST_SERVICE_ROLE_KEY = "test-service-role-key";
export const TEST_OPENPLANTBOOK_KEY = "test-plantbook-key";
export const TEST_CRON_API_KEY = "test-cron-key";
export const TEST_AUTH_HEADER = "Bearer test-jwt-token";
export const TEST_USER_ID = "user-test-123";

/** Default environment satisfying most edge function startup env-var checks. */
export const TEST_ENV: Record<string, string | undefined> = {
  SUPABASE_URL: TEST_SUPABASE_URL,
  SUPABASE_ANON_KEY: TEST_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: TEST_SERVICE_ROLE_KEY,
  OPENPLANTBOOK_API_KEY: TEST_OPENPLANTBOOK_KEY,
  CRON_API_KEY: TEST_CRON_API_KEY,
};

/** Minimal user shape returned by Supabase GET /auth/v1/user. */
export const TEST_USER = {
  id: TEST_USER_ID,
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Auth response helpers
// ---------------------------------------------------------------------------

/** Builds a Response that satisfies supabase-js GET /auth/v1/user (success). */
export function authOk(user = TEST_USER): Response {
  return json(user);
}

/** Builds a Response that causes supabase-js auth.getUser() to return an error. */
export function authFail(): Response {
  return new Response(JSON.stringify({ message: "Invalid token" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// JSON response shorthand
// ---------------------------------------------------------------------------

/** Builds a JSON Response with the given data and status. */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Environment stub
// ---------------------------------------------------------------------------

/**
 * Replaces Deno.env.get with a function that looks up keys in `env`.
 * Returns a restore function; call it in afterAll/finally.
 *
 * The `env` map is captured by reference, so tests can temporarily mutate
 * specific keys to simulate missing env vars:
 *   testEnv.OPENPLANTBOOK_API_KEY = undefined;
 *   // run test …
 *   testEnv.OPENPLANTBOOK_API_KEY = TEST_OPENPLANTBOOK_KEY;
 */
export function stubEnv(env: Record<string, string | undefined>): () => void {
  const original = Deno.env.get.bind(Deno.env);

  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Deno.env as any).get = (key: string): string | undefined => env[key];
  return () => {
    // deno-lint-ignore no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Deno.env as any).get = original;
  };
}

// ---------------------------------------------------------------------------
// Deno.serve intercept
// ---------------------------------------------------------------------------

export type EdgeHandler = (req: Request) => Response | Promise<Response>;

/**
 * Intercepts Deno.serve so the handler can be captured for direct testing.
 * Must be called BEFORE the dynamic `import()` of the edge function module,
 * because the module calls Deno.serve at the top level on first import.
 *
 * Usage (in beforeAll):
 *   const intercept = interceptServe();
 *   await import("../../my-function/index.ts");
 *   intercept.restore();
 *   handler = intercept.getHandler();
 */
export function interceptServe(): {
  getHandler: () => EdgeHandler;
  restore: () => void;
} {
  let captured: EdgeHandler | null = null;
  const original = Deno.serve;

  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Deno as any).serve = (...args: unknown[]) => {
    const handler = typeof args[0] === "function" ? args[0] : args[1];
    if (typeof handler === "function") {
      captured = handler as EdgeHandler;
    }
    // Return a minimal HttpServer stub so callers (if any) don't throw.
    return {
      addr: { hostname: "0.0.0.0", port: 8000, transport: "tcp" },
      finished: Promise.resolve(),
      shutdown: () => Promise.resolve(),
      ref: () => {},
      unref: () => {},
      [Symbol.asyncDispose]: () => Promise.resolve(),
    };
  };

  return {
    getHandler: () => {
      if (!captured) throw new Error("Deno.serve was not called — did the module import succeed?");
      return captured;
    },
    restore: () => {
      // deno-lint-ignore no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Deno as any).serve = original;
    },
  };
}

// ---------------------------------------------------------------------------
// Fetch mock factory
// ---------------------------------------------------------------------------

/**
 * Builds a fetch mock that dispatches requests to route handlers based on URL
 * substrings. Routes are checked in insertion order; the first matching pattern
 * wins. Falls back to a 404 response if no pattern matches.
 *
 * Use more-specific patterns before broader ones:
 *   routedFetch({
 *     "rest/v1/user_garden_progress": (req) => …, // specific first
 *     "/rest/v1/": () => json([]),                 // catch-all last
 *   })
 */
export function routedFetch(
  routes: Record<string, (req: Request) => Response | Promise<Response>>,
): typeof fetch {
  return ((input: string | URL | Request, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input.toString(), init);
    for (const [pattern, handler] of Object.entries(routes)) {
      if (req.url.includes(pattern)) return Promise.resolve(handler(req));
    }
    console.warn(`[routedFetch] Unmatched: ${req.method} ${req.url}`);
    return Promise.resolve(new Response(`No mock for: ${req.url}`, { status: 404 }));
  }) as typeof fetch;
}
