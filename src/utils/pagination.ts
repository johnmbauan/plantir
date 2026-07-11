export interface PaginationMeta {
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
}

export function paginationMeta(
  totalCount: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);

  return {
    totalPages,
    rangeStart: totalCount === 0 ? 0 : start + 1,
    rangeEnd: end,
  };
}
