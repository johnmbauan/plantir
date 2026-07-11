/**
 * Represents metadata about the pagination state for a dataset.
 *
 * Fields:
 * - totalPages: The total number of available pages, based on the total item count and the size of each page.
 * - currentPage: The actual page number being used, always clamped to the valid range [1, totalPages]. For example, if a user requests page 100 but only 5 pages exist, currentPage will be 5; if they request page 0 or a negative number, currentPage will be 1.
 * - rangeStart: The 1-based index of the first item on the current page (returns 0 if there are no items).
 * - rangeEnd: The 1-based index of the last item on the current page (equal to rangeStart if there are no items).
 */
export interface PaginationMeta {
  totalPages: number;
  currentPage: number;
  rangeStart: number;
  rangeEnd: number;
}

export function paginationMeta(
  totalCount: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);

  return {
    totalPages,
    currentPage,
    rangeStart: totalCount === 0 ? 0 : start + 1,
    rangeEnd: end,
  };
}
