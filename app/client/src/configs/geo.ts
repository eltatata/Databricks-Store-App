import type { StateMetric, StateMetricDefinition } from '@/types/state-map.types';

export const STATE_METRICS: StateMetricDefinition[] = [
  { value: 'gmv', label: 'GMV', format: 'currency' },
  { value: 'orders', label: 'Orders', format: 'count' },
  { value: 'averageOrderValue', label: 'Average order value', format: 'currency' },
  { value: 'freight', label: 'Freight', format: 'currency' },
];

export const DEFAULT_STATE_METRIC: StateMetric = 'gmv';

export const STATE_MAP_COLORS = [
  'var(--chart-scale-01)',
  'var(--chart-scale-02)',
  'var(--chart-scale-03)',
  'var(--chart-scale-04)',
  'var(--chart-scale-05)',
] as const;

export const STATE_MAP_EMPTY_COLOR = 'var(--raised-2)';
export const STATE_MAP_BORDER_COLOR = 'var(--ground)';
export const STATE_MAP_ASPECT_RATIO = '1 / 1';
export const BRAZIL_CENTER: [number, number] = [-54, -15.1];
export const BRAZIL_SCALE_PER_PIXEL = 1.3;
export const MIN_STATES_FOR_MAP = 3;
