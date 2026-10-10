import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';
import { ERROR_CODES } from '../utils/errors';

export const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).meta({ description: 'Page number, starting at 1' }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .meta({ description: `Items per page, up to ${MAX_PAGE_SIZE}` }),
});

export const dateRangeQuerySchema = z
  .object({
    from: z.iso.date().optional().meta({ description: 'Inclusive start purchase date (YYYY-MM-DD)' }),
    to: z.iso.date().optional().meta({ description: 'Inclusive end purchase date (YYYY-MM-DD)' }),
  })
  .refine((range) => !range.from || !range.to || range.from <= range.to, {
    message: 'from must be on or before to',
    path: ['from'],
  });

export const paginationMetaSchema = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
  .meta({ id: 'PaginationMeta' });

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.enum(ERROR_CODES),
      message: z.string(),
      details: z.unknown().optional(),
      requestId: z.string(),
    }),
  })
  .meta({ id: 'ErrorResponse' });

export const healthResponseSchema = z
  .object({
    data: z.object({
      status: z.enum(['ok', 'degraded']),
      database: z.enum(['up', 'down']),
      appliedMigrations: z.number().int(),
      checkedAt: z.string(),
    }),
  })
  .meta({ id: 'HealthResponse' });

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
