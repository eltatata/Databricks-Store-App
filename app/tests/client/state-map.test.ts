import { describe, expect, it } from 'vitest';
import { STATE_METRICS } from '@/configs/geo';
import type { StateBreakdownRow } from '@/types/dashboard.types';
import { analyticsValueFormatter, buildAnalyticsResult } from '@/utils/analytics-result';
import { parseToolResult } from '@/utils/agent-tool-results';
import { buildStateMapSteps, stepColorOf, toStateMapData } from '@/utils/state-map';

const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5'];

const statement = (columns: [string, string][], rows: string[][]) => ({
  manifest: { schema: { columns: columns.map(([name, type_name]) => ({ name, type_name })) } },
  result: { data_array: rows },
});

const metric = (value: string) => STATE_METRICS.find((definition) => definition.value === value)!;

const rows: StateBreakdownRow[] = [
  { customerState: 'RJ', gmv: 300, orders: 30, freight: 40, averageOrderValue: 10 },
  { customerState: 'SP', gmv: 900, orders: 60, freight: 80, averageOrderValue: 15 },
  { customerState: 'AC', gmv: 20, orders: 1, freight: 9, averageOrderValue: 20 },
];

describe('buildStateMapSteps', () => {
  it('splits the values into quantile steps from light to dark', () => {
    const steps = buildStateMapSteps([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], COLORS);
    expect(steps).toEqual([
      { color: 'c1', min: 1, max: 2 },
      { color: 'c2', min: 3, max: 4 },
      { color: 'c3', min: 5, max: 6 },
      { color: 'c4', min: 7, max: 8 },
      { color: 'c5', min: 9, max: 10 },
    ]);
    expect(stepColorOf(steps, 6, 'empty')).toBe('c3');
    expect(stepColorOf(steps, 99, 'empty')).toBe('c5');
  });

  it('keeps the darkest colors when there are fewer states than steps', () => {
    expect(buildStateMapSteps([5, 1], COLORS).map((step) => step.color)).toEqual(['c4', 'c5']);
    expect(buildStateMapSteps([], COLORS)).toEqual([]);
  });
});

describe('toStateMapData', () => {
  it('maps the chosen metric and sorts states from highest to lowest', () => {
    expect(toStateMapData(rows, metric('freight')).map((datum) => [datum.state, datum.value])).toEqual([
      ['SP', 80],
      ['RJ', 40],
      ['AC', 9],
    ]);
  });

  it('describes orders with GMV and every other metric with orders', () => {
    expect(toStateMapData(rows, metric('orders'))[0]?.detail).toBe('R$900');
    expect(toStateMapData(rows, metric('gmv'))[0]?.detail).toBe('60');
  });
});

describe('buildAnalyticsResult state maps', () => {
  it('turns a Genie result keyed by Brazilian states into a map', () => {
    const result = buildAnalyticsResult({
      attachmentId: 'a1',
      statement: statement(
        [
          ['customer_state', 'STRING'],
          ['orders', 'BIGINT'],
        ],
        [
          ['SP', '41746'],
          ['rj', '12852'],
          ['MG', '11635'],
        ]
      ),
    });
    expect(result?.chart).toEqual({ kind: 'map', xKey: 'customer_state', yKey: 'orders' });
  });

  it('keeps a bar chart when the labels are not states', () => {
    const result = buildAnalyticsResult({
      attachmentId: 'a2',
      statement: statement(
        [
          ['category', 'STRING'],
          ['gmv', 'DOUBLE'],
        ],
        [
          ['health_beauty', '10'],
          ['auto', '5'],
          ['toys', '3'],
        ]
      ),
    });
    expect(result?.chart?.kind).not.toBe('map');
  });
});

describe('analyticsValueFormatter', () => {
  it('shows rate columns between 0 and 1 as percentages', () => {
    expect(analyticsValueFormatter('late_delivery_rate', [0.0137, 0.2071])(0.2071)).toBe('20.71%');
  });

  it('keeps three significant digits for other measures', () => {
    expect(analyticsValueFormatter('avg_freight', [0.4, 20])(0.137)).toBe('0.137');
    expect(analyticsValueFormatter('orders', [41746])(41746)).toBe('41.7K');
  });
});

describe('parseToolResult for sales by state', () => {
  it('reads the state breakdown with its range', () => {
    const output = JSON.stringify({ from: '2017-01-01', to: '2017-12-31', metric: 'orders', states: rows });
    expect(parseToolResult('get_sales_by_state', output)).toEqual({
      kind: 'states',
      sales: { from: '2017-01-01', to: '2017-12-31', metric: 'orders', states: rows },
    });
  });

  it('opens on GMV when the metric is missing or unknown', () => {
    const output = JSON.stringify({ from: null, to: null, metric: 'margin', states: [] });
    expect(parseToolResult('get_sales_by_state', output)).toMatchObject({ kind: 'states', sales: { metric: 'gmv' } });
  });
});
