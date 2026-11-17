import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { API_PREFIX } from '../../server/config/constants';
import type { ApiErrorBody } from '../../server/interfaces/api.interface';
import type { RouteDefinition } from '../../server/interfaces/route.interface';
import { errorHandler } from '../../server/middlewares/error.middleware';
import { readValidated } from '../../server/middlewares/validate.middleware';
import { buildApiRouter } from '../../server/routes';
import { asyncHandler } from '../../server/utils/async-handler';
import { internalError, notFound } from '../../server/utils/errors';

const echoQuery: RequestHandler = (_request, response) => {
  response.json({ data: readValidated<{ query: unknown }>(response).query });
};

const routes: RouteDefinition[] = [
  {
    method: 'get',
    path: '/echo',
    summary: 'Echo validated query',
    tag: 'Test',
    request: { query: z.object({ page: z.coerce.number().int().min(1) }) },
    responses: { 200: { description: 'ok' } },
    handler: echoQuery,
  },
  {
    method: 'post',
    path: '/strict',
    summary: 'Strict body',
    tag: 'Test',
    request: { body: z.strictObject({ name: z.string().min(1) }) },
    responses: { 200: { description: 'ok' } },
    handler: (_request, response) => {
      response.json({ data: 'created' });
    },
  },
  {
    method: 'get',
    path: '/missing',
    summary: 'Not found error',
    tag: 'Test',
    responses: { 404: { description: 'missing' } },
    handler: asyncHandler(() => Promise.reject(notFound('Product', 'abc'))),
  },
  {
    method: 'get',
    path: '/crash',
    summary: 'Unexpected error',
    tag: 'Test',
    responses: { 500: { description: 'crash' } },
    handler: asyncHandler(() => Promise.reject(internalError(new Error('database password leaked in message')))),
  },
];

interface OpenApiBody {
  paths: Record<string, Record<string, unknown>>;
}

function errorBody(response: request.Response): ApiErrorBody['error'] {
  return (response.body as ApiErrorBody).error;
}

function buildTestApp() {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.get('/api/genie/olist/messages', (_request, response) => {
    response.json({ plugin: true });
  });
  app.use(API_PREFIX, buildApiRouter({ devUserEmail: 'dev@example.com' }, routes));
  app.use(API_PREFIX, errorHandler);
  return app;
}

describe('API router', () => {
  const app = buildTestApp();

  it('passes coerced, validated query values to the handler', async () => {
    const response = await request(app).get(`${API_PREFIX}/echo?page=2`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { page: 2 } });
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('rejects invalid query values with field details', async () => {
    const response = await request(app).get(`${API_PREFIX}/echo?page=0`);

    expect(response.status).toBe(400);
    expect(errorBody(response).code).toBe('VALIDATION_ERROR');
    expect((errorBody(response).details as unknown[])[0]).toMatchObject({ location: 'query', path: 'page' });
    expect(errorBody(response).requestId).toBeTruthy();
  });

  it('rejects unknown body keys', async () => {
    const response = await request(app).post(`${API_PREFIX}/strict`).send({ name: 'ok', role: 'admin' });

    expect(response.status).toBe(400);
  });

  it('turns malformed JSON into a validation error', async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/strict`)
      .set('content-type', 'application/json')
      .send('{"name":');

    expect(response.status).toBe(400);
    expect(errorBody(response).message).toBe('The request body is not valid JSON');
  });

  it('maps oversized bodies to 413', async () => {
    const response = await request(app)
      .post(`${API_PREFIX}/strict`)
      .send({ name: 'x'.repeat(5000) });

    expect(response.status).toBe(413);
  });

  it('returns application errors with their status and code', async () => {
    const response = await request(app).get(`${API_PREFIX}/missing`);

    expect(response.status).toBe(404);
    expect(errorBody(response)).toMatchObject({ code: 'NOT_FOUND', message: 'Product abc was not found' });
  });

  it('hides internal error messages and stack traces', async () => {
    const response = await request(app).get(`${API_PREFIX}/crash`);

    expect(response.status).toBe(500);
    expect(errorBody(response).message).toBe('An unexpected error occurred');
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('returns 404 for unknown API routes', async () => {
    const response = await request(app).get(`${API_PREFIX}/does-not-exist`);

    expect(response.status).toBe(404);
    expect(errorBody(response).code).toBe('NOT_FOUND');
  });

  it('does not intercept plugin routes outside the API prefix', async () => {
    const response = await request(app).get('/api/genie/olist/messages');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ plugin: true });
  });

  it('serves the OpenAPI document', async () => {
    const response = await request(app).get(`${API_PREFIX}/openapi.json`);

    expect(response.status).toBe(200);
    expect((response.body as OpenApiBody).paths[`${API_PREFIX}/echo`].get).toBeDefined();
  });
});
