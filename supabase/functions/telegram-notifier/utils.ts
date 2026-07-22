/** JSON.stringify that safely serialises postgres bigint columns (JS BigInt → Number). */
export function jsonStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? Number(v) : v));
}
