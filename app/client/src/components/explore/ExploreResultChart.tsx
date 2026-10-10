import { useMemo } from 'react';
import { Area } from '@/components/charts/area';
import { AreaChart } from '@/components/charts/area-chart';
import { Bar } from '@/components/charts/bar';
import { BarChart } from '@/components/charts/bar-chart';
import { BarYAxis } from '@/components/charts/bar-y-axis';
import { Grid } from '@/components/charts/grid';
import { ChartTooltip } from '@/components/charts/tooltip';
import { XAxis } from '@/components/charts/x-axis';
import { YAxis } from '@/components/charts/y-axis';
import { BAR_CHART_MARGIN, CHART_ANIMATION_MS, CHART_COLORS, CHART_MARGIN } from '@/configs/chart-theme';
import type { ExploreResult } from '@/hooks/explore/useExplore';
import { formatCompactCount, toDisplayText } from '@/utils/format';

const MAX_BARS = 15;

const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value));

interface ExploreResultChartProps {
  result: ExploreResult;
}

export function ExploreResultChart({ result }: ExploreResultChartProps) {
  const chart = result.chart;
  const data = useMemo(() => {
    if (!chart) {
      return [];
    }
    if (chart.kind === 'line') {
      return result.rows
        .map((row) => ({ date: new Date(toDisplayText(row[chart.xKey])), value: toNumber(row[chart.yKey]) }))
        .filter((point) => !Number.isNaN(point.date.getTime()) && Number.isFinite(point.value))
        .sort((left, right) => left.date.getTime() - right.date.getTime());
    }
    return result.rows
      .slice(0, MAX_BARS)
      .map((row) => ({ label: toDisplayText(row[chart.xKey]), value: toNumber(row[chart.yKey]) }))
      .filter((point) => Number.isFinite(point.value));
  }, [chart, result.rows]);

  if (!chart || data.length < 2) {
    return null;
  }

  const rows = (point: Record<string, unknown>) => [
    { color: CHART_COLORS.primary, label: chart.yKey, value: formatCompactCount(point.value as number) },
  ];

  if (chart.kind === 'line') {
    return (
      <AreaChart data={data} margin={CHART_MARGIN} aspectRatio="16 / 6" animationDuration={CHART_ANIMATION_MS}>
        <Grid horizontal numTicksRows={4} strokeDasharray="0" />
        <Area dataKey="value" fill={CHART_COLORS.primary} fillOpacity={0.16} strokeWidth={1.5} />
        <XAxis numTicks={5} />
        <YAxis numTicks={4} formatValue={formatCompactCount} />
        <ChartTooltip rows={rows} />
      </AreaChart>
    );
  }

  return (
    <BarChart
      data={data}
      xDataKey="label"
      orientation="horizontal"
      margin={BAR_CHART_MARGIN}
      aspectRatio={`16 / ${Math.max(4, Math.min(data.length, 10))}`}
      barGap={0.5}
      animationDuration={CHART_ANIMATION_MS}
    >
      <Bar dataKey="value" fill={CHART_COLORS.bar} lineCap={1} fadedOpacity={0.28} />
      <BarYAxis />
      <ChartTooltip showCrosshair={false} showDatePill={false} rows={rows} />
    </BarChart>
  );
}
