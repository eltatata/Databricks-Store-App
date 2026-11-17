import { http } from '@/api/http';
import type {
  CategoryBreakdownRow,
  DashboardSummary,
  DataFreshness,
  DateRange,
  RankingParams,
  SalesTrendParams,
  SalesTrendPoint,
  StateBreakdownRow,
  TopProductRow,
  TopProductsParams,
  TopSellerRow,
} from '@/types/dashboard.types';

const unwrap = async <T>(promise: Promise<{ data: T }>): Promise<T> => (await promise).data;

export const dashboardService = {
  getSummary: (range: DateRange, signal?: AbortSignal) =>
    unwrap(http.get<DashboardSummary>('/dashboard/summary', { query: { ...range }, signal })),

  getSalesTrend: (params: SalesTrendParams, signal?: AbortSignal) =>
    unwrap(http.get<SalesTrendPoint[]>('/dashboard/sales-trend', { query: { ...params }, signal })),

  getCategoryBreakdown: (params: RankingParams, signal?: AbortSignal) =>
    unwrap(http.get<CategoryBreakdownRow[]>('/dashboard/by-category', { query: { ...params }, signal })),

  getStateBreakdown: (range: DateRange, signal?: AbortSignal) =>
    unwrap(http.get<StateBreakdownRow[]>('/dashboard/by-state', { query: { ...range }, signal })),

  getTopProducts: (params: TopProductsParams, signal?: AbortSignal) =>
    unwrap(http.get<TopProductRow[]>('/dashboard/top-products', { query: { ...params }, signal })),

  getTopSellers: (limit: number, signal?: AbortSignal) =>
    unwrap(http.get<TopSellerRow[]>('/dashboard/top-sellers', { query: { limit }, signal })),

  getFreshness: (signal?: AbortSignal) => unwrap(http.get<DataFreshness>('/dashboard/freshness', { signal })),
};
