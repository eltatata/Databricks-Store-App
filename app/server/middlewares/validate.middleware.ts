import type { RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { badRequest } from '../utils/errors';

type RequestPart = 'params' | 'query' | 'body';

export type RequestSchemas = Partial<Record<RequestPart, ZodType>>;

interface ValidationIssue {
  location: RequestPart;
  path: string;
  message: string;
}

const REQUEST_PARTS: RequestPart[] = ['params', 'query', 'body'];

export function validate(schemas: RequestSchemas): RequestHandler {
  return (request, response, next) => {
    const validated: Partial<Record<RequestPart, unknown>> = {};
    const issues: ValidationIssue[] = [];
    for (const part of REQUEST_PARTS) {
      const schema = schemas[part];
      if (!schema) {
        continue;
      }
      const result = schema.safeParse(request[part]);
      if (result.success) {
        validated[part] = result.data;
        continue;
      }
      issues.push(
        ...result.error.issues.map((issue) => ({ location: part, path: issue.path.join('.'), message: issue.message }))
      );
    }
    if (issues.length > 0) {
      next(badRequest('The request is invalid', issues));
      return;
    }
    response.locals.validated = validated;
    next();
  };
}

export function readValidated<T>(response: Response): T {
  return response.locals.validated as T;
}
