import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import type { RequestSchemas } from '../middlewares/validate.middleware';

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

export interface RouteResponse {
  description: string;
  schema?: ZodType;
}

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  summary: string;
  tag: string;
  request?: RequestSchemas;
  responses: Record<number, RouteResponse>;
  handler: RequestHandler;
}
