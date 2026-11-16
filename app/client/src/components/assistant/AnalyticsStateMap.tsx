import { useMemo } from 'react';
import { BrazilStateMap } from '@/components/common/BrazilStateMap';
import type { AnalyticsChart } from '@/types/analytics.types';
import { analyticsValueFormatter, toStateCode } from '@/utils/analytics-result';

interface AnalyticsStateMapProps {
  rows: Record<string, unknown>[];
  chart: AnalyticsChart;
}

const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value));

export function AnalyticsStateMap({ rows, chart }: AnalyticsStateMapProps) {
  const data = useMemo(
    () =>
      rows
        .map((row) => ({ state: toStateCode(row[chart.xKey]), value: toNumber(row[chart.yKey]), detail: null }))
        .filter((datum) => Number.isFinite(datum.value)),
    [rows, chart]
  );

  const formatValue = useMemo(
    () =>
      analyticsValueFormatter(
        chart.yKey,
        data.map((datum) => datum.value)
      ),
    [chart.yKey, data]
  );

  return (
    <BrazilStateMap
      data={data}
      valueLabel={chart.yKey}
      formatValue={formatValue}
      className="w-full max-w-[520px] self-center"
    />
  );
}
