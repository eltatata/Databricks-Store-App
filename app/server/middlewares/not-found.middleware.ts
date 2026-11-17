import type { RequestHandler } from 'express';
import { routeNotFound } from '../utils/errors';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(routeNotFound(request.method, request.originalUrl));
};
