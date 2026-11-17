import type { ApiEnvelope, ApiErrorBody, ApiErrorCode, FieldIssue, QueryParams } from '@/types/api.types';

const API_BASE = '/api/v1';
export const AGENTS_API_BASE = '/api/agents';
const REQUEST_ID_HEADER = 'x-request-id';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(params: { status: number; code: ApiErrorCode; message: string; details?: unknown; requestId?: string }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const fieldIssuesOf = (error: unknown): FieldIssue[] => {
  if (!isApiError(error) || !Array.isArray(error.details)) {
    return [];
  }
  return error.details.filter(
    (issue): issue is FieldIssue =>
      typeof issue === 'object' &&
      issue !== null &&
      typeof (issue as FieldIssue).path === 'string' &&
      typeof (issue as FieldIssue).message === 'string'
  );
};

const buildUrl = (path: string, query?: QueryParams, base = API_BASE): string => {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const search = params.toString();
  return `${base}${path}${search ? `?${search}` : ''}`;
};

const isErrorBody = (body: unknown): body is ApiErrorBody =>
  typeof body === 'object' &&
  body !== null &&
  'error' in body &&
  typeof (body as ApiErrorBody).error?.code === 'string';

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const toApiError = (response: Response, body: unknown): ApiError => {
  if (isErrorBody(body)) {
    return new ApiError({ status: response.status, ...body.error });
  }
  return new ApiError({
    status: response.status,
    code: response.status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
    message: `The server answered ${response.status} ${response.statusText}`.trim(),
    requestId: response.headers.get(REQUEST_ID_HEADER) ?? undefined,
  });
};

interface RequestOptions {
  base?: string;
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

const request = async <T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> => {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query, options.base), {
      method,
      signal: options.signal,
      headers: options.body === undefined ? { Accept: 'application/json' } : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'The app could not reach the server' });
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw toApiError(response, body);
  }
  return (body ?? { data: null }) as ApiEnvelope<T>;
};

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body: unknown, options?: Pick<RequestOptions, 'base'>) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('DELETE', path, options),
};
