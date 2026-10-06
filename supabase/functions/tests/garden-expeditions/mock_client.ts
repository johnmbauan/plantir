import type { BondGrant } from "../../garden-expeditions/bonds.ts";

export type TableSpec = { data: unknown; error?: { message?: string; code?: string } | null };

export function makeBuilder(data: unknown, error: unknown = null) {
  const p = Promise.resolve({ data, error });
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    not: () => b,
    limit: () => b,
    order: () => b,
    in: () => b,
    lte: () => b,
    gte: () => b,
    insert: () => b,
    update: () => b,
    upsert: () => b,
    maybeSingle: () => p,
    single: () => p,
    then: (
      onfulfilled: (v: unknown) => unknown,
      onrejected?: (v: unknown) => unknown,
    ) => p.then(onfulfilled, onrejected),
    catch: (onrejected: (v: unknown) => unknown) => p.catch(onrejected),
  };
  return b;
}

export function createClient(
  tables: Record<string, TableSpec>,
  options: { email?: string | null } = {},
) {
  const counts: Record<string, number> = {};
  return {
    from(table: string) {
      counts[table] = (counts[table] ?? 0) + 1;
      const r = tables[`${table}:${counts[table]}`] ?? tables[table] ?? { data: [], error: null };
      return makeBuilder(r.data, r.error ?? null);
    },
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: options.email === null ? null : { email: options.email ?? "test@example.com" } },
        }),
      },
    },
  };
}

export const USER_ID = "user-1";

export function careGrant(partial: Partial<BondGrant> = {}): BondGrant {
  return {
    achievementKey: "hello_my_name_is",
    points: 8,
    source: "care",
    reasonCode: "care_plant",
    subjectId: "p1",
    ...partial,
  };
}
