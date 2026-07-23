/** Case-insensitive substring match across fields; empty query matches everything. */
export function matchesAnySearchField(
  search: string,
  fields: Array<string | null | undefined>,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => (field ?? "").toLowerCase().includes(q));
}
