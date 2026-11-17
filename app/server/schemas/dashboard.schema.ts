import { z } from 'zod';
import { DEFAULT_RANKING_LIMIT, MAX_RANKING_LIMIT } from '../config/constants';
import { dateRangeQuerySchema } from './common.schema';

const rankingLimitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_RANKING_LIMIT)
  .default(DEFAULT_RANKING_LIMIT)
  .meta({ description: `Number of rows, up to ${MAX_RANKING_LIMIT}` });

export const salesTrendQuerySchema = dateRangeQuerySchema.safeExtend({
  granularity: z.enum(['day', 'month']).default('month'),
});

export const categoryBreakdownQuerySchema = dateRangeQuerySchema.safeExtend({ limit: rankingLimitSchema });

export const topProductsQuerySchema = z.object({
  limit: rankingLimitSchema,
  category: z.string().trim().min(1).max(100).optional(),
});

export const topSellersQuerySchema = z.object({ limit: rankingLimitSchema });

const nullableNumber = z.number().nullable();

export const dashboardSummaryResponseSchema = z
  .object({
    data: z.object({
      gmv: z.number(),
      orders: z.number().int(),
      itemsSold: z.number().int(),
      freight: z.number(),
      customers: z.number().int(),
      averageOrderValue: nullableNumber,
      averageReviewScore: nullableNumber,
      lateDeliveryRate: nullableNumber,
      firstOrderDate: z.string().nullable(),
      lastOrderDate: z.string().nullable(),
    }),
  })
  .meta({ id: 'DashboardSummaryResponse' });

export const salesTrendResponseSchema = z
  .object({
    data: z.array(
      z.object({ period: z.string(), gmv: z.number(), orders: z.number().int(), averageOrderValue: nullableNumber })
    ),
  })
  .meta({ id: 'SalesTrendResponse' });

export const categoryBreakdownResponseSchema = z
  .object({
    data: z.array(
      z.object({ categoryEn: z.string(), gmv: z.number(), unitsSold: z.number().int(), orders: z.number().int() })
    ),
  })
  .meta({ id: 'CategoryBreakdownResponse' });

export const stateBreakdownResponseSchema = z
  .object({
    data: z.array(
      z.object({
        customerState: z.string(),
        gmv: z.number(),
        orders: z.number().int(),
        freight: z.number(),
        averageOrderValue: nullableNumber,
      })
    ),
  })
  .meta({ id: 'StateBreakdownResponse' });

export const topProductsResponseSchema = z
  .object({
    data: z.array(
      z.object({
        productId: z.string(),
        displayName: z.string().nullable(),
        categoryEn: z.string().nullable(),
        gmv: nullableNumber,
        unitsSold: nullableNumber,
        averageReviewScore: nullableNumber,
        gmvRank: nullableNumber,
      })
    ),
  })
  .meta({ id: 'TopProductsResponse' });

export const topSellersResponseSchema = z
  .object({
    data: z.array(
      z.object({
        sellerId: z.string(),
        sellerState: z.string().nullable(),
        gmv: nullableNumber,
        orders: nullableNumber,
        lateDeliveryRate: nullableNumber,
        gmvRank: nullableNumber,
      })
    ),
  })
  .meta({ id: 'TopSellersResponse' });

export const freshnessResponseSchema = z
  .object({ data: z.object({ firstOrderDate: z.string().nullable(), lastOrderDate: z.string().nullable() }) })
  .meta({ id: 'FreshnessResponse' });

export type SalesTrendQuery = z.infer<typeof salesTrendQuerySchema>;
export type CategoryBreakdownQuery = z.infer<typeof categoryBreakdownQuerySchema>;
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
export type TopSellersQuery = z.infer<typeof topSellersQuerySchema>;
