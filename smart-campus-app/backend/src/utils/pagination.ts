export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parsePagination(query: Record<string, string | undefined>): PaginationOptions {
  return {
    page: Math.max(1, parseInt(query.page || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(query.limit || '25', 10))),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
  };
}

export function skipTake(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
