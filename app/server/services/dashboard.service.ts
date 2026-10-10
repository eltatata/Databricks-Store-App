import {
  countDistinctCustomers,
  findTopProducts,
  findTopSellers,
  sumKpis,
  sumKpisByPeriod,
  sumSalesByCategory,
  sumSalesByState,
} from '../database/queries/dashboard.queries';
import type {
  CategoryBreakdownRow,
  DashboardSummary,
  DataFreshness,
  DateRange,
  SalesTrendPoint,
  StateBreakdownRow,
  TopProductRow,
  TopSellerRow,
} from '../interfaces/dashboard.interface';
import { roundTo, safeRatio } from '../utils/numbers';

const MONEY_DECIMALS = 2;
const RATE_DECIMALS = 4;

export async function getSummary(range: DateRange): Promise<DashboardSummary> {
  const [totals, customers] = await Promise.all([sumKpis(range), countDistinctCustomers(range)]);
  return {
    gmv: roundTo(totals.gmv, MONEY_DECIMALS),
    orders: totals.orders,
    itemsSold: totals.itemsSold,
    freight: roundTo(totals.freight, MONEY_DECIMALS),
    customers,
    averageOrderValue: safeRatio(totals.gmv, totals.orders, MONEY_DECIMALS),
    averageReviewScore: safeRatio(totals.reviewScoreSum, totals.reviewedOrders, MONEY_DECIMALS),
    lateDeliveryRate: safeRatio(totals.lateOrders, totals.deliveredOrders, RATE_DECIMALS),
    firstOrderDate: totals.firstOrderDate,
    lastOrderDate: totals.lastOrderDate,
  };
}

export async function getSalesTrend(range: DateRange, granularity: 'day' | 'month'): Promise<SalesTrendPoint[]> {
  const rows = await sumKpisByPeriod(range, granularity);
  return rows.map((row) => ({
    period: row.period,
    gmv: roundTo(row.gmv, MONEY_DECIMALS),
    orders: row.orders,
    averageOrderValue: safeRatio(row.gmv, row.orders, MONEY_DECIMALS),
  }));
}

export async function getCategoryBreakdown(range: DateRange, limit: number): Promise<CategoryBreakdownRow[]> {
  const rows = await sumSalesByCategory(range, limit);
  return rows.map((row) => ({ ...row, gmv: roundTo(row.gmv, MONEY_DECIMALS) }));
}

export async function getStateBreakdown(range: DateRange): Promise<StateBreakdownRow[]> {
  const rows = await sumSalesByState(range);
  return rows.map((row) => ({
    ...row,
    gmv: roundTo(row.gmv, MONEY_DECIMALS),
    averageOrderValue: safeRatio(row.gmv, row.orders, MONEY_DECIMALS),
  }));
}

export function getTopProducts(limit: number, category?: string): Promise<TopProductRow[]> {
  return findTopProducts(limit, category);
}

export function getTopSellers(limit: number): Promise<TopSellerRow[]> {
  return findTopSellers(limit);
}

export async function getFreshness(): Promise<DataFreshness> {
  const totals = await sumKpis({});
  return { firstOrderDate: totals.firstOrderDate, lastOrderDate: totals.lastOrderDate };
}
