import { readValidated } from '../middlewares/validate.middleware';
import type { DateRangeQuery } from '../schemas/common.schema';
import type {
  CategoryBreakdownQuery,
  SalesTrendQuery,
  TopProductsQuery,
  TopSellersQuery,
} from '../schemas/dashboard.schema';
import * as dashboardService from '../services/dashboard.service';
import { asyncHandler } from '../utils/async-handler';
import { sendOk } from '../utils/response';

export const getSummary = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: DateRangeQuery }>(response);
  sendOk(response, await dashboardService.getSummary(query));
});

export const getSalesTrend = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: SalesTrendQuery }>(response);
  sendOk(response, await dashboardService.getSalesTrend(query, query.granularity));
});

export const getCategoryBreakdown = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: CategoryBreakdownQuery }>(response);
  sendOk(response, await dashboardService.getCategoryBreakdown(query, query.limit));
});

export const getStateBreakdown = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: DateRangeQuery }>(response);
  sendOk(response, await dashboardService.getStateBreakdown(query));
});

export const getTopProducts = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: TopProductsQuery }>(response);
  sendOk(response, await dashboardService.getTopProducts(query.limit, query.category));
});

export const getTopSellers = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: TopSellersQuery }>(response);
  sendOk(response, await dashboardService.getTopSellers(query.limit));
});

export const getFreshness = asyncHandler(async (_request, response) => {
  sendOk(response, await dashboardService.getFreshness());
});
