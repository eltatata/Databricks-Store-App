import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '../interfaces/api.interface';
import { type AppError, badRequest, internalError, isAppError, payloadTooLarge } from '../utils/errors';
import { logger, serializeError } from '../utils/logger';
import { readRequestContext } from './request-context.middleware';

const PAYLOAD_TOO_LARGE_TYPE = 'entity.too.large';
const MALFORMED_JSON_TYPE = 'entity.parse.failed';

interface BodyParserError {
  type?: unknown;
}

function isBodyParserError(error: unknown, type: string): boolean {
  return typeof error === 'object' && error !== null && (error as BodyParserError).type === type;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof ZodError) {
    return badRequest(
      'The request is invalid',
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    );
  }
  if (isBodyParserError(error, MALFORMED_JSON_TYPE)) {
    return badRequest('The request body is not valid JSON');
  }
  if (isBodyParserError(error, PAYLOAD_TOO_LARGE_TYPE)) {
    return payloadTooLarge();
  }
  return internalError(error);
}

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  const appError = toAppError(error);
  const { requestId, userEmail } = readRequestContext(response);
  const logFields = {
    requestId,
    userEmail,
    method: request.method,
    path: request.originalUrl,
    status: appError.status,
    code: appError.code,
    ...serializeError(appError.cause ?? error),
  };
  if (appError.status >= 500) {
    logger.error('Request failed', logFields);
  } else {
    logger.warn('Request rejected', logFields);
  }
  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.expose ? appError.message : 'An unexpected error occurred',
      details: appError.expose ? appError.details : undefined,
      requestId,
    },
  };
  response.status(appError.status).json(body);
};
