export interface DateRange {
  from?: string;
  to?: string;
}

export type TrendGranularity = 'day' | 'month';

export interface DashboardSummary {
  gmv: number;
  orders: number;
  itemsSold: number;
  freight: number;
  customers: number;
  averageOrderValue: number | null;
  averageReviewScore: number | null;
  lateDeliveryRate: number | null;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
}

export interface SalesTrendPoint {
  period: string;
  gmv: number;
  orders: number;
  averageOrderValue: number | null;
}

export interface CategoryBreakdownRow {
  categoryEn: string;
  gmv: number;
  unitsSold: number;
  orders: number;
}

export interface StateBreakdownRow {
  customerState: string;
  gmv: number;
  orders: number;
  freight: number;
  averageOrderValue: number | null;
}

export interface TopProductRow {
  productId: string;
  displayName: string | null;
  categoryEn: string | null;
  gmv: number | null;
  unitsSold: number | null;
  averageReviewScore: number | null;
  gmvRank: number | null;
}

export interface TopSellerRow {
  sellerId: string;
  sellerState: string | null;
  gmv: number | null;
  orders: number | null;
  lateDeliveryRate: number | null;
  gmvRank: number | null;
}

export interface DataFreshness {
  firstOrderDate: string | null;
  lastOrderDate: string | null;
}

export interface SalesTrendParams extends DateRange {
  granularity: TrendGranularity;
}

export interface RankingParams extends DateRange {
  limit?: number;
}

export interface TopProductsParams {
  limit?: number;
  category?: string;
}

export type KpiKey = 'gmv' | 'orders' | 'averageOrderValue' | 'customers' | 'averageReviewScore' | 'lateDeliveryRate';

export type KpiFormat = 'currency' | 'count' | 'score' | 'percent';

export interface KpiDefinition {
  key: KpiKey;
  label: string;
  format: KpiFormat;
  higherIsBetter: boolean;
}

export interface KpiReading {
  definition: KpiDefinition;
  value: number | null;
  previous: number | null;
  change: number | null;
}
