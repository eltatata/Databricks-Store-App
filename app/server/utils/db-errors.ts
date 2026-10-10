import { type AppError, conflict, databaseUnavailable, internalError, isAppError, unprocessable } from './errors';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const CHECK_VIOLATION = '23514';
const NOT_NULL_VIOLATION = '23502';
const SERIALIZATION_FAILURE = '40001';
const CONNECTION_EXCEPTION_CLASS = '08';
const ADMIN_SHUTDOWN = '57P01';
const NETWORK_ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);
const MAX_CAUSE_DEPTH = 5;

interface ErrorWithCode {
  code?: unknown;
  cause?: unknown;
  constraint?: unknown;
}

function asErrorWithCode(value: unknown): ErrorWithCode | undefined {
  return typeof value === 'object' && value !== null ? (value as ErrorWithCode) : undefined;
}

export function findDriverErrorCode(error: unknown): string | undefined {
  let current = asErrorWithCode(error);
  for (let depth = 0; current && depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (typeof current.code === 'string') {
      return current.code;
    }
    current = asErrorWithCode(current.cause);
  }
  return undefined;
}

function findConstraintName(error: unknown): string | undefined {
  let current = asErrorWithCode(error);
  for (let depth = 0; current && depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (typeof current.constraint === 'string') {
      return current.constraint;
    }
    current = asErrorWithCode(current.cause);
  }
  return undefined;
}

function isConnectionError(code: string): boolean {
  return code.startsWith(CONNECTION_EXCEPTION_CLASS) || code === ADMIN_SHUTDOWN || NETWORK_ERROR_CODES.has(code);
}

export function mapDatabaseError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  const code = findDriverErrorCode(error);
  const constraint = findConstraintName(error);
  if (code === UNIQUE_VIOLATION) {
    return conflict('A record with the same identifier already exists', error);
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return conflict('The record is referenced by other records', error);
  }
  if (code === SERIALIZATION_FAILURE) {
    return conflict('The record changed concurrently. Try again', error);
  }
  if (code === CHECK_VIOLATION || code === NOT_NULL_VIOLATION) {
    return unprocessable('The data violates a database rule', constraint ? { constraint } : undefined, error);
  }
  if (code && isConnectionError(code)) {
    return databaseUnavailable(error);
  }
  return internalError(error);
}
