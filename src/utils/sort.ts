export type SortDirection = "asc" | "desc";

/** Nulls / empty values sort last regardless of direction. */
export function compareNullableNumber(
  a: number | null,
  b: number | null,
  direction: SortDirection,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

/** Nulls / empty values sort last regardless of direction. */
export function compareNullableString(
  a: string | null,
  b: string | null,
  direction: SortDirection,
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b);
  return direction === "asc" ? cmp : -cmp;
}

export function compareString(a: string, b: string, direction: SortDirection): number {
  const cmp = a.localeCompare(b);
  return direction === "asc" ? cmp : -cmp;
}

/** Toggle direction when re-clicking the same column; otherwise start ascending. */
export function nextSortState<T extends string>(
  currentKey: T,
  currentDir: SortDirection,
  nextKey: T,
): { sortKey: T; sortDir: SortDirection } {
  if (currentKey === nextKey) {
    return { sortKey: currentKey, sortDir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { sortKey: nextKey, sortDir: "asc" };
}
