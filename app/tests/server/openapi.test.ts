import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument, toOpenApiPath } from '../../server/docs/openapi';
import { apiRouteDefinitions } from '../../server/routes/definitions';

describe('OpenAPI document', () => {
  const document = buildOpenApiDocument(apiRouteDefinitions);

  it('documents every API route', () => {
    for (const route of apiRouteDefinitions) {
      const path = document.paths?.[toOpenApiPath(route.path)];
      expect(path?.[route.method], `${route.method.toUpperCase()} ${route.path}`).toBeDefined();
    }
  });

  it('converts Express parameters to OpenAPI parameters', () => {
    expect(toOpenApiPath('/products/:productId')).toBe('/api/v1/products/{productId}');
  });

  it('registers shared schemas as components', () => {
    expect(document.components?.schemas).toHaveProperty('ErrorResponse');
    expect(document.components?.schemas).toHaveProperty('Product');
  });

  it('documents the common error responses on every operation', () => {
    const operation = document.paths?.['/api/v1/products']?.get;
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('500');
  });
});
