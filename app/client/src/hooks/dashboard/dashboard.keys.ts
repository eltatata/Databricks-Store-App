import type { DateRange, RankingParams, SalesTrendParams, TopProductsParams } from '@/types/dashboard.types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (range: DateRange) => [...dashboardKeys.all, 'summary', range] as const,
  salesTrend: (params: SalesTrendParams) => [...dashboardKeys.all, 'sales-trend', params] as const,
  categoryBreakdown: (params: RankingParams) => [...dashboardKeys.all, 'by-category', params] as const,
  stateBreakdown: (range: DateRange) => [...dashboardKeys.all, 'by-state', range] as const,
  topProducts: (params: TopProductsParams) => [...dashboardKeys.all, 'top-products', params] as const,
  topSellers: (limit: number) => [...dashboardKeys.all, 'top-sellers', limit] as const,
  freshness: () => [...dashboardKeys.all, 'freshness'] as const,
};
