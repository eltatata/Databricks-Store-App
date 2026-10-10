import { OpenAPIRegistry, OpenApiGeneratorV3, type RouteConfig } from '@asteasolutions/zod-to-openapi';
import type { ZodObject, ZodType } from 'zod';
import { API_PREFIX } from '../config/constants';
import type { RouteDefinition, RouteResponse } from '../interfaces/route.interface';
import { errorResponseSchema } from '../schemas/common.schema';

type OpenApiDocument = ReturnType<OpenApiGeneratorV3['generateDocument']>;

const COMMON_ERROR_RESPONSES: Record<number, RouteResponse> = {
  400: { description: 'Invalid request', schema: errorResponseSchema },
  500: { description: 'Unexpected error', schema: errorResponseSchema },
  503: { description: 'Database unavailable', schema: errorResponseSchema },
};

export function toOpenApiPath(expressPath: string): string {
  return `${API_PREFIX}${expressPath.replace(/:(\w+)/g, '{$1}')}`;
}

function toJsonContent(schema: ZodType) {
  return { 'application/json': { schema } };
}

function toResponses(responses: Record<number, RouteResponse>): RouteConfig['responses'] {
  const merged = { ...COMMON_ERROR_RESPONSES, ...responses };
  return Object.fromEntries(
    Object.entries(merged).map(([status, response]) => [
      status,
      { description: response.description, content: response.schema ? toJsonContent(response.schema) : undefined },
    ])
  );
}

function toRouteConfig(route: RouteDefinition): RouteConfig {
  return {
    method: route.method,
    path: toOpenApiPath(route.path),
    summary: route.summary,
    tags: [route.tag],
    request: {
      params: route.request?.params as ZodObject | undefined,
      query: route.request?.query as ZodObject | undefined,
      body: route.request?.body ? { content: toJsonContent(route.request.body), required: true } : undefined,
    },
    responses: toResponses(route.responses),
  };
}

export function buildOpenApiDocument(routes: RouteDefinition[]): OpenApiDocument {
  const registry = new OpenAPIRegistry();
  routes.forEach((route) => registry.registerPath(toRouteConfig(route)));
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Olist Store API',
      version: '1.0.0',
      description: 'Dashboard KPIs served from Lakebase synced Gold tables and product administration on Lakebase.',
    },
  });
}
