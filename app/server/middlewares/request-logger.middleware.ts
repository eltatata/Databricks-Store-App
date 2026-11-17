import type { RequestHandler } from 'express';
import { logger } from '../utils/logger';
import { readRequestContext } from './request-context.middleware';

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = process.hrtime.bigint();
  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const { requestId } = readRequestContext(response);
    logger.info('Request completed', {
      requestId,
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs: Math.round(durationMs),
    });
  });
  next();
};
