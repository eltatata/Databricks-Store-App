export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'VERSION_CONFLICT',
  'UNPROCESSABLE',
  'DB_UNAVAILABLE',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface FieldIssue {
  path: string;
  message: string;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;
