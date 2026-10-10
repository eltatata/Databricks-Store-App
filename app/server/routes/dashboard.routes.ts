import * as dashboardController from '../controllers/dashboard.controller';
import type { RouteDefinition } from '../interfaces/route.interface';
import { dateRangeQuerySchema } from '../schemas/common.schema';
import {
  categoryBreakdownQuerySchema,
  categoryBreakdownResponseSchema,
  dashboardSummaryResponseSchema,
  freshnessResponseSchema,
  salesTrendQuerySchema,
  salesTrendResponseSchema,
  stateBreakdownResponseSchema,
  topProductsQuerySchema,
  topProductsResponseSchema,
  topSellersQuerySchema,
  topSellersResponseSchema,
} from '../schemas/dashboard.schema';

const TAG = 'Dashboard';

export const dashboardRoutes: RouteDefinition[] = [
  {
    method: 'get',
    path: '/dashboard/summary',
    summary: 'Headline KPIs for a purchase date range',
    tag: TAG,
    request: { query: dateRangeQuerySchema },
    responses: { 200: { description: 'KPI summary', schema: dashboardSummaryResponseSchema } },
    handler: dashboardController.getSummary,
  },
  {
    method: 'get',
    path: '/dashboard/sales-trend',
    summary: 'GMV and orders by day or month',
    tag: TAG,
    request: { query: salesTrendQuerySchema },
    responses: { 200: { description: 'Sales trend', schema: salesTrendResponseSchema } },
    handler: dashboardController.getSalesTrend,
  },
  {
    method: 'get',
    path: '/dashboard/by-category',
    summary: 'GMV by product category',
    tag: TAG,
    request: { query: categoryBreakdownQuerySchema },
    responses: { 200: { description: 'Category breakdown', schema: categoryBreakdownResponseSchema } },
    handler: dashboardController.getCategoryBreakdown,
  },
  {
    method: 'get',
    path: '/dashboard/by-state',
    summary: 'GMV by customer state',
    tag: TAG,
    request: { query: dateRangeQuerySchema },
    responses: { 200: { description: 'State breakdown', schema: stateBreakdownResponseSchema } },
    handler: dashboardController.getStateBreakdown,
  },
  {
    method: 'get',
    path: '/dashboard/top-products',
    summary: 'Products ranked by lifetime GMV',
    tag: TAG,
    request: { query: topProductsQuerySchema },
    responses: { 200: { description: 'Top products', schema: topProductsResponseSchema } },
    handler: dashboardController.getTopProducts,
  },
  {
    method: 'get',
    path: '/dashboard/top-sellers',
    summary: 'Sellers ranked by lifetime GMV',
    tag: TAG,
    request: { query: topSellersQuerySchema },
    responses: { 200: { description: 'Top sellers', schema: topSellersResponseSchema } },
    handler: dashboardController.getTopSellers,
  },
  {
    method: 'get',
    path: '/dashboard/freshness',
    summary: 'Purchase date range covered by the synced data',
    tag: TAG,
    responses: { 200: { description: 'Data freshness', schema: freshnessResponseSchema } },
    handler: dashboardController.getFreshness,
  },
];
