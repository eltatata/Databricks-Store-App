import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DASHBOARD_STALE_TIME_MS } from '@/configs/dashboard';
import { dashboardService } from '@/services/dashboard.service';
import type { DateRange, RankingParams, SalesTrendParams, TopProductsParams } from '@/types/dashboard.types';
import { dashboardKeys } from './dashboard.keys';

const sharedOptions = { staleTime: DASHBOARD_STALE_TIME_MS, placeholderData: keepPreviousData };

export const useSalesTrend = (params: SalesTrendParams) =>
  useQuery({
    queryKey: dashboardKeys.salesTrend(params),
    queryFn: ({ signal }) => dashboardService.getSalesTrend(params, signal),
    ...sharedOptions,
  });

export const useCategoryBreakdown = (params: RankingParams) =>
  useQuery({
    queryKey: dashboardKeys.categoryBreakdown(params),
    queryFn: ({ signal }) => dashboardService.getCategoryBreakdown(params, signal),
    ...sharedOptions,
  });

export const useStateBreakdown = (range: DateRange) =>
  useQuery({
    queryKey: dashboardKeys.stateBreakdown(range),
    queryFn: ({ signal }) => dashboardService.getStateBreakdown(range, signal),
    ...sharedOptions,
  });

export const useTopProducts = (params: TopProductsParams) =>
  useQuery({
    queryKey: dashboardKeys.topProducts(params),
    queryFn: ({ signal }) => dashboardService.getTopProducts(params, signal),
    ...sharedOptions,
  });

export const useTopSellers = (limit: number) =>
  useQuery({
    queryKey: dashboardKeys.topSellers(limit),
    queryFn: ({ signal }) => dashboardService.getTopSellers(limit, signal),
    ...sharedOptions,
  });

export const useFreshness = () =>
  useQuery({
    queryKey: dashboardKeys.freshness(),
    queryFn: ({ signal }) => dashboardService.getFreshness(signal),
    staleTime: DASHBOARD_STALE_TIME_MS,
  });
