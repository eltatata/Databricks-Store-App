import { describe, expect, it } from 'vitest';
import { findDriverErrorCode, mapDatabaseError } from '../../server/utils/db-errors';
import { AppError, notFound } from '../../server/utils/errors';
import { roundTo, safeRatio } from '../../server/utils/numbers';
import { buildPaginationMeta, toOffset } from '../../server/utils/pagination';
import { buildContainsPattern, escapeLikePattern } from '../../server/utils/sql';

function driverError(code: string, constraint?: string) {
  return Object.assign(new Error('driver failure'), { code, constraint });
}

describe('mapDatabaseError', () => {
  it.each([
    ['23505', 409, 'CONFLICT'],
    ['23503', 409, 'CONFLICT'],
    ['40001', 409, 'CONFLICT'],
    ['23514', 422, 'UNPROCESSABLE'],
    ['23502', 422, 'UNPROCESSABLE'],
    ['08006', 503, 'DB_UNAVAILABLE'],
    ['ECONNREFUSED', 503, 'DB_UNAVAILABLE'],
    ['XX000', 500, 'INTERNAL_ERROR'],
  ])('maps driver code %s to %i %s', (code, status, errorCode) => {
    const mapped = mapDatabaseError(driverError(code));

    expect(mapped.status).toBe(status);
    expect(mapped.code).toBe(errorCode);
  });

  it('reads the driver code from a wrapped cause', () => {
    const wrapped = Object.assign(new Error('Failed query'), { cause: driverError('23505') });

    expect(findDriverErrorCode(wrapped)).toBe('23505');
    expect(mapDatabaseError(wrapped).status).toBe(409);
  });

  it('exposes the violated constraint for check violations', () => {
    expect(mapDatabaseError(driverError('23514', 'products_price_non_negative')).details).toEqual({
      constraint: 'products_price_non_negative',
    });
  });

  it('returns application errors unchanged', () => {
    const original = notFound('Product', 'abc');

    expect(mapDatabaseError(original)).toBe(original);
  });

  it('hides unknown errors behind a non-exposed internal error', () => {
    const mapped = mapDatabaseError(new Error('secret connection string'));

    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.expose).toBe(false);
  });
});

describe('sql helpers', () => {
  it('escapes LIKE wildcards', () => {
    expect(escapeLikePattern('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('builds a trimmed contains pattern', () => {
    expect(buildContainsPattern('  bed  ')).toBe('%bed%');
  });
});

describe('pagination', () => {
  it('converts pages to offsets', () => {
    expect(toOffset(3, 20)).toBe(40);
  });

  it('builds metadata with at least one page', () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
    expect(buildPaginationMeta(2, 20, 41)).toEqual({ page: 2, pageSize: 20, total: 41, totalPages: 3 });
  });
});

describe('numbers', () => {
  it('rounds to the given decimals', () => {
    expect(roundTo(137.4218, 2)).toBe(137.42);
  });

  it('returns null ratios for empty denominators', () => {
    expect(safeRatio(10, 0, 2)).toBeNull();
    expect(safeRatio(1, 3, 4)).toBe(0.3333);
  });
});
