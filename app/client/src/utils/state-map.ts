import type { StateBreakdownRow } from '@/types/dashboard.types';
import type { StateMapDatum, StateMapStep, StateMetric, StateMetricDefinition } from '@/types/state-map.types';
import { formatCompactCurrency, formatCount } from './format';

export const buildStateMapSteps = (values: number[], colors: readonly string[]): StateMapStep[] => {
  const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) {
    return [];
  }
  const stepCount = Math.min(colors.length, sorted.length);
  const colorOffset = colors.length - stepCount;
  return Array.from({ length: stepCount }, (_, index) => {
    const start = Math.floor((index * sorted.length) / stepCount);
    const end = Math.floor(((index + 1) * sorted.length) / stepCount) - 1;
    return { color: colors[colorOffset + index] ?? '', min: sorted[start] ?? 0, max: sorted[end] ?? 0 };
  });
};

export const stepColorOf = (steps: StateMapStep[], value: number, fallback: string) =>
  steps.find((step) => value <= step.max)?.color ?? steps.at(-1)?.color ?? fallback;

export const indexByState = (data: StateMapDatum[]) => new Map(data.map((datum) => [datum.state, datum]));

const metricValueOf = (row: StateBreakdownRow, metric: StateMetric) => row[metric] ?? 0;

export const formatStateMetric = (definition: StateMetricDefinition, value: number) =>
  definition.format === 'count' ? formatCount(value) : formatCompactCurrency(value);

export const toStateMapData = (rows: StateBreakdownRow[], definition: StateMetricDefinition): StateMapDatum[] =>
  rows
    .map((row) => ({
      state: row.customerState,
      value: metricValueOf(row, definition.value),
      detail: definition.value === 'orders' ? formatCompactCurrency(row.gmv) : formatCount(row.orders),
    }))
    .sort((left, right) => right.value - left.value);
