import { inferChartType, transformGenieData } from '@databricks/appkit-ui/react';
import { BRAZIL_STATE_NAMES } from '@/configs/brazil-states';
import { MIN_STATES_FOR_MAP } from '@/configs/geo';
import { formatMeasure, formatPercent } from './format';
import type {
  AnalyticsChart,
  AnalyticsChartKind,
  AnalyticsColumn,
  AnalyticsResult,
  AnalyticsResultSource,
} from '@/types/analytics.types';

const CHART_KINDS: Record<string, AnalyticsChartKind> = {
  bar: 'bar',
  pie: 'bar',
  donut: 'bar',
  line: 'line',
  area: 'line',
};

const toChart = (
  rows: Record<string, unknown>[],
  columns: AnalyticsColumn[],
  rawColumns: Parameters<typeof inferChartType>[1]
): AnalyticsChart | null => {
  const inference = inferChartType(rows, rawColumns);
  const kind = inference ? CHART_KINDS[inference.chartType] : undefined;
  const yKey = inference && (Array.isArray(inference.yKey) ? inference.yKey[0] : inference.yKey);
  if (!inference || !kind || !yKey || !columns.some((column) => column.name === inference.xKey)) {
    return null;
  }
  return { kind, xKey: inference.xKey, yKey };
};

const RATE_COLUMN_PATTERN = /rate|ratio|pct|percent|share/i;

export const analyticsValueFormatter = (columnName: string, values: number[]) =>
  RATE_COLUMN_PATTERN.test(columnName) && values.every((value) => value >= 0 && value <= 1)
    ? formatPercent
    : formatMeasure;

export const toStateCode = (value: unknown) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

const isStateColumn = (rows: Record<string, unknown>[], column: AnalyticsColumn) =>
  column.category === 'string' &&
  rows.length >= MIN_STATES_FOR_MAP &&
  rows.every((row) => BRAZIL_STATE_NAMES.has(toStateCode(row[column.name])));

const toStateChart = (
  rows: Record<string, unknown>[],
  columns: AnalyticsColumn[],
  preferredValueKey: string | undefined
): AnalyticsChart | null => {
  const stateColumn = columns.find((column) => isStateColumn(rows, column));
  const numericColumns = columns.filter((column) => column.category === 'numeric');
  const valueColumn = numericColumns.find((column) => column.name === preferredValueKey) ?? numericColumns[0];
  return stateColumn && valueColumn ? { kind: 'map', xKey: stateColumn.name, yKey: valueColumn.name } : null;
};

export const buildAnalyticsResult = (source: AnalyticsResultSource): AnalyticsResult | null => {
  const transformed = transformGenieData(source.statement);
  if (!transformed) {
    return null;
  }
  const columns = transformed.columns.map(({ name, category }) => ({ name, category }));
  const chart = toChart(transformed.rows, columns, transformed.columns);
  return {
    attachmentId: source.attachmentId,
    title: source.title ?? null,
    description: source.description ?? null,
    sql: source.sql ?? null,
    rows: transformed.rows,
    columns,
    chart: toStateChart(transformed.rows, columns, chart?.yKey) ?? chart,
  };
};
