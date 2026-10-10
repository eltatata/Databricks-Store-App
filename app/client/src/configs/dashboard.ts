import type { KpiDefinition, TrendGranularity } from '@/types/dashboard.types';

export type PeriodPresetId = 'h1-2018' | 'jan-aug-2018' | 'h2-2017' | 'year-2017' | 'all-time' | 'custom';

export interface PeriodPreset {
  id: Exclude<PeriodPresetId, 'custom'>;
  label: string;
  from?: string;
  to?: string;
}

export const PERIOD_PRESETS: PeriodPreset[] = [
  { id: 'jan-aug-2018', label: 'Jan – Aug 2018', from: '2018-01-01', to: '2018-08-31' },
  { id: 'h1-2018', label: 'H1 2018', from: '2018-01-01', to: '2018-06-30' },
  { id: 'h2-2017', label: 'H2 2017', from: '2017-07-01', to: '2017-12-31' },
  { id: 'year-2017', label: '2017', from: '2017-01-01', to: '2017-12-31' },
  { id: 'all-time', label: 'All time' },
];

export const DEFAULT_PERIOD_PRESET: PeriodPresetId = 'jan-aug-2018';
export const DEFAULT_TREND_GRANULARITY: TrendGranularity = 'month';

export const DATASET_START = '2016-09-01';
export const DATASET_END = '2018-10-31';

export const KPI_DEFINITIONS: KpiDefinition[] = [
  { key: 'gmv', label: 'Gross merchandise value', format: 'currency', higherIsBetter: true },
  { key: 'orders', label: 'Orders', format: 'count', higherIsBetter: true },
  { key: 'averageOrderValue', label: 'Average order value', format: 'currency', higherIsBetter: true },
  { key: 'customers', label: 'Customers', format: 'count', higherIsBetter: true },
  { key: 'averageReviewScore', label: 'Average review', format: 'score', higherIsBetter: true },
  { key: 'lateDeliveryRate', label: 'Late deliveries', format: 'percent', higherIsBetter: false },
];

export const CATEGORY_BREAKDOWN_LIMIT = 8;
export const STATE_BREAKDOWN_LIMIT = 10;
export const RANKING_TABLE_LIMIT = 8;
export const DASHBOARD_STALE_TIME_MS = 5 * 60_000;
