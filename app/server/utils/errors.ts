export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'VERSION_CONFLICT',
  'UNPROCESSABLE',
  'DB_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

interface AppErrorParams {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
  expose: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly expose: boolean;
  readonly cause?: unknown;

  constructor(params: AppErrorParams) {
    super(params.message);
    this.name = 'AppError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.expose = params.expose;
    this.cause = params.cause;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError({ status: 400, code: 'VALIDATION_ERROR', message, details, expose: true });
}

export function notFound(entity: string, id: string): AppError {
  return new AppError({ status: 404, code: 'NOT_FOUND', message: `${entity} ${id} was not found`, expose: true });
}

export function routeNotFound(method: string, path: string): AppError {
  return new AppError({
    status: 404,
    code: 'NOT_FOUND',
    message: `Route ${method} ${path} does not exist`,
    expose: true,
  });
}

export function payloadTooLarge(): AppError {
  return new AppError({
    status: 413,
    code: 'VALIDATION_ERROR',
    message: 'The request body is too large',
    expose: true,
  });
}

export function conflict(message: string, cause?: unknown): AppError {
  return new AppError({ status: 409, code: 'CONFLICT', message, expose: true, cause });
}

export function versionConflict(entity: string, id: string): AppError {
  return new AppError({
    status: 409,
    code: 'VERSION_CONFLICT',
    message: `${entity} ${id} was modified by someone else. Reload it and try again`,
    expose: true,
  });
}

export function unprocessable(message: string, details?: unknown, cause?: unknown): AppError {
  return new AppError({ status: 422, code: 'UNPROCESSABLE', message, details, expose: true, cause });
}

export function databaseUnavailable(cause: unknown): AppError {
  return new AppError({
    status: 503,
    code: 'DB_UNAVAILABLE',
    message: 'The database is temporarily unavailable. Try again in a moment',
    expose: true,
    cause,
  });
}

export function internalError(cause: unknown): AppError {
  return new AppError({
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    expose: false,
    cause,
  });
}
