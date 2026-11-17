import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { dateRangeQuerySchema } from '../../server/schemas/common.schema';
import {
  createProductBodySchema,
  deleteProductQuerySchema,
  listProductsQuerySchema,
  updateProductBodySchema,
} from '../../server/schemas/products.schema';

const SERVING_TABLES = [
  'kpiDaily',
  'customerActivityDaily',
  'salesByCategoryMonth',
  'salesByStateMonth',
  'productPerformance',
  'sellerPerformance',
  'dimProduct',
];
const WRITE_CALL = /\.(insert|update|delete)\(\s*(\w+)\s*\)/g;

describe('product schemas', () => {
  it('rejects categories that are not snake_case', () => {
    expect(createProductBodySchema.safeParse({ displayName: 'Lamp', categoryEn: 'Home Decor' }).success).toBe(false);
  });

  it('rejects negative prices', () => {
    expect(
      createProductBodySchema.safeParse({ displayName: 'Lamp', categoryEn: 'housewares', listPriceBrl: -1 }).success
    ).toBe(false);
  });

  it('requires at least one change besides version', () => {
    expect(updateProductBodySchema.safeParse({ version: 1 }).success).toBe(false);
    expect(updateProductBodySchema.safeParse({ version: 1, isActive: false }).success).toBe(true);
  });

  it('applies list defaults and rejects unknown sort fields', () => {
    expect(listProductsQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
      sortBy: 'displayName',
      sortDirection: 'asc',
    });
    expect(listProductsQuerySchema.safeParse({ sortBy: 'password' }).success).toBe(false);
  });

  it('parses the permanent delete flag', () => {
    expect(deleteProductQuerySchema.parse({}).permanent).toBe(false);
    expect(deleteProductQuerySchema.parse({ permanent: 'true' }).permanent).toBe(true);
  });

  it('rejects inverted date ranges', () => {
    expect(dateRangeQuerySchema.safeParse({ from: '2018-02-01', to: '2018-01-01' }).success).toBe(false);
  });
});

describe('serving tables are read-only', () => {
  it('never inserts, updates or deletes a synced serving table', () => {
    const queriesDirectory = path.resolve(__dirname, '../../server/database/queries');
    const writesToServing = readdirSync(queriesDirectory).flatMap((file) => {
      const source = readFileSync(path.join(queriesDirectory, file), 'utf8');
      return [...source.matchAll(WRITE_CALL)]
        .map((match) => match[2])
        .filter((table) => SERVING_TABLES.includes(table))
        .map((table) => `${file}: ${table}`);
    });

    expect(writesToServing).toEqual([]);
  });

  it('keeps the serving schema out of drizzle-kit migrations', () => {
    const config = readFileSync(path.resolve(__dirname, '../../drizzle.config.ts'), 'utf8');

    expect(config).toContain("schema: './server/database/schema/app.schema.ts'");
    expect(config).toContain("schemaFilter: ['app']");
  });
});
