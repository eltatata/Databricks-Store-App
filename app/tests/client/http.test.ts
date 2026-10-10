import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fieldIssuesOf, http, isApiError } from '@/api/http';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('http client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefixes the API base path and drops empty query values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await http.get('/products', { query: { search: 'lamp', category: undefined, page: 2, empty: '' } });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/products?search=lamp&page=2',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('turns the error envelope into an ApiError with its code and request id', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(409, { error: { code: 'VERSION_CONFLICT', message: 'Stale version', requestId: 'req-1' } })
        )
    );

    const error = await http.patch('/products/p1', { version: 1 }).catch((caught: unknown) => caught);

    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 409, code: 'VERSION_CONFLICT', requestId: 'req-1' });
  });

  it('reports a network failure as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(http.get('/health')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('maps a non-envelope server failure to INTERNAL_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 })));

    await expect(http.get('/health')).rejects.toMatchObject({ code: 'INTERNAL_ERROR', status: 502 });
  });

  it('extracts only well-formed field issues', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid',
      details: [{ path: 'displayName', message: 'Required' }, { nope: true }, 'text'],
    });

    expect(fieldIssuesOf(error)).toEqual([{ path: 'displayName', message: 'Required' }]);
    expect(fieldIssuesOf(new Error('plain'))).toEqual([]);
  });
});
