export type SortDirection = "asc" | "desc";

export function compareNullable<T>(
  a: T | null | undefined,
  b: T | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return 0;
}

export function compareStrings(
  a: string | null,
  b: string | null,
  direction: SortDirection,
): number {
  const nullCmp = compareNullable(a, b);
  if (nullCmp !== 0) return nullCmp;
  const cmp = (a ?? "").localeCompare(b ?? "");
  return direction === "asc" ? cmp : -cmp;
}

export function compareNumbers(
  a: number | null,
  b: number | null,
  direction: SortDirection,
): number {
  const nullCmp = compareNullable(a, b);
  if (nullCmp !== 0) return nullCmp;
  const cmp = (a ?? 0) - (b ?? 0);
  return direction === "asc" ? cmp : -cmp;
}

export function compareDates(
  a: string | null,
  b: string | null,
  direction: SortDirection,
): number {
  const nullCmp = compareNullable(a, b);
  if (nullCmp !== 0) return nullCmp;
  const cmp = new Date(a!).getTime() - new Date(b!).getTime();
  return direction === "asc" ? cmp : -cmp;
}
