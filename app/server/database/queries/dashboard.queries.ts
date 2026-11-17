import { type AnyColumn, type SQL, and, asc, countDistinct, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type {
  CategoryBreakdownRow,
  DateRange,
  StateBreakdownRow,
  TopProductRow,
  TopSellerRow,
} from '../../interfaces/dashboard.interface';
import { getDb, runQuery } from '../client';
import {
  customerActivityDaily,
  kpiDaily,
  productPerformance,
  salesByCategoryMonth,
  salesByStateMonth,
  sellerPerformance,
} from '../schema';

interface KpiTotals {
  gmv: number;
  orders: number;
  itemsSold: number;
  freight: number;
  reviewedOrders: number;
  reviewScoreSum: number;
  deliveredOrders: number;
  lateOrders: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
}

type TrendGranularity = 'day' | 'month';

interface TrendRow {
  period: string;
  gmv: number;
  orders: number;
}

const sumAsNumber = (column: AnyColumn) => sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number);

function dateRangeCondition(column: AnyColumn, range: DateRange): SQL | undefined {
  const conditions: SQL[] = [];
  if (range.from) {
    conditions.push(gte(column, range.from));
  }
  if (range.to) {
    conditions.push(lte(column, range.to));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

function monthRangeCondition(column: AnyColumn, range: DateRange): SQL | undefined {
  const conditions: SQL[] = [];
  if (range.from) {
    conditions.push(sql`${column} >= date_trunc('month', ${range.from}::date)::date`);
  }
  if (range.to) {
    conditions.push(lte(column, range.to));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function sumKpis(range: DateRange): Promise<KpiTotals> {
  const [row] = await runQuery(() =>
    getDb()
      .select({
        gmv: sumAsNumber(kpiDaily.gmv),
        orders: sumAsNumber(kpiDaily.orders),
        itemsSold: sumAsNumber(kpiDaily.itemsSold),
        freight: sumAsNumber(kpiDaily.freight),
        reviewedOrders: sumAsNumber(kpiDaily.reviewedOrders),
        reviewScoreSum: sumAsNumber(kpiDaily.reviewScoreSum),
        deliveredOrders: sumAsNumber(kpiDaily.deliveredOrders),
        lateOrders: sumAsNumber(kpiDaily.lateOrders),
        firstOrderDate: sql<string | null>`min(${kpiDaily.orderDate})::text`,
        lastOrderDate: sql<string | null>`max(${kpiDaily.orderDate})::text`,
      })
      .from(kpiDaily)
      .where(dateRangeCondition(kpiDaily.orderDate, range))
  );
  return row;
}

export async function countDistinctCustomers(range: DateRange): Promise<number> {
  const [row] = await runQuery(() =>
    getDb()
      .select({ customers: countDistinct(customerActivityDaily.customerUniqueId) })
      .from(customerActivityDaily)
      .where(dateRangeCondition(customerActivityDaily.orderDate, range))
  );
  return row?.customers ?? 0;
}

const TRUNCATION_UNITS: Record<TrendGranularity, SQL> = {
  day: sql.raw("'day'"),
  month: sql.raw("'month'"),
};

export function sumKpisByPeriod(range: DateRange, granularity: TrendGranularity): Promise<TrendRow[]> {
  const period = sql<string>`to_char(date_trunc(${TRUNCATION_UNITS[granularity]}, ${kpiDaily.orderDate}), 'YYYY-MM-DD')`;
  return runQuery(() =>
    getDb()
      .select({ period, gmv: sumAsNumber(kpiDaily.gmv), orders: sumAsNumber(kpiDaily.orders) })
      .from(kpiDaily)
      .where(dateRangeCondition(kpiDaily.orderDate, range))
      .groupBy(period)
      .orderBy(asc(period))
  );
}

export function sumSalesByCategory(range: DateRange, limit: number): Promise<CategoryBreakdownRow[]> {
  const gmv = sumAsNumber(salesByCategoryMonth.gmv);
  return runQuery(() =>
    getDb()
      .select({
        categoryEn: salesByCategoryMonth.categoryEn,
        gmv,
        unitsSold: sumAsNumber(salesByCategoryMonth.unitsSold),
        orders: sumAsNumber(salesByCategoryMonth.orders),
      })
      .from(salesByCategoryMonth)
      .where(monthRangeCondition(salesByCategoryMonth.orderMonth, range))
      .groupBy(salesByCategoryMonth.categoryEn)
      .orderBy(desc(gmv))
      .limit(limit)
  );
}

export async function sumSalesByState(range: DateRange): Promise<StateBreakdownRow[]> {
  const gmv = sumAsNumber(salesByStateMonth.gmv);
  const rows = await runQuery(() =>
    getDb()
      .select({
        customerState: salesByStateMonth.customerState,
        gmv,
        orders: sumAsNumber(salesByStateMonth.orders),
        freight: sumAsNumber(salesByStateMonth.freight),
      })
      .from(salesByStateMonth)
      .where(monthRangeCondition(salesByStateMonth.orderMonth, range))
      .groupBy(salesByStateMonth.customerState)
      .orderBy(desc(gmv))
  );
  return rows.map((row) => ({ ...row, averageOrderValue: row.orders > 0 ? row.gmv / row.orders : null }));
}

export function findTopProducts(limit: number, category?: string): Promise<TopProductRow[]> {
  return runQuery(() =>
    getDb()
      .select({
        productId: productPerformance.productId,
        displayName: productPerformance.displayName,
        categoryEn: productPerformance.categoryEn,
        gmv: productPerformance.gmv,
        unitsSold: productPerformance.unitsSold,
        averageReviewScore: productPerformance.averageReviewScore,
        gmvRank: productPerformance.gmvRank,
      })
      .from(productPerformance)
      .where(category ? eq(productPerformance.categoryEn, category) : undefined)
      .orderBy(asc(productPerformance.gmvRank))
      .limit(limit)
  );
}

export function findTopSellers(limit: number): Promise<TopSellerRow[]> {
  return runQuery(() =>
    getDb()
      .select({
        sellerId: sellerPerformance.sellerId,
        sellerState: sellerPerformance.sellerState,
        gmv: sellerPerformance.gmv,
        orders: sellerPerformance.orders,
        lateDeliveryRate: sellerPerformance.lateDeliveryRate,
        gmvRank: sellerPerformance.gmvRank,
      })
      .from(sellerPerformance)
      .orderBy(asc(sellerPerformance.gmvRank))
      .limit(limit)
  );
}
