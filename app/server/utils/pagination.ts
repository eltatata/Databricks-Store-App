import type { PaginationMeta } from '../interfaces/api.interface';

export function toOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
