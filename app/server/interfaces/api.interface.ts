import type { ErrorCode } from '../utils/errors';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
