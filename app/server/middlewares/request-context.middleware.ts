import { randomUUID } from 'node:crypto';
import type { RequestHandler, Response } from 'express';
import { REQUEST_ID_HEADER, USER_EMAIL_HEADER } from '../config/constants';
import type { RequestContext } from '../interfaces/context.interface';

const UNKNOWN_USER = 'unknown';

export interface RequestContextOptions {
  devUserEmail?: string;
}

export function requestContext(options: RequestContextOptions): RequestHandler {
  return (request, response, next) => {
    const requestId = request.header(REQUEST_ID_HEADER) ?? randomUUID();
    const userEmail = request.header(USER_EMAIL_HEADER) ?? options.devUserEmail ?? UNKNOWN_USER;
    const context: RequestContext = { requestId, userEmail };
    response.locals.context = context;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  };
}

export function readRequestContext(response: Response): RequestContext {
  const context = response.locals.context as RequestContext | undefined;
  return context ?? { requestId: randomUUID(), userEmail: UNKNOWN_USER };
}
