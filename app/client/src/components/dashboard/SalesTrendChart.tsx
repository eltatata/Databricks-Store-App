import { parseISO } from 'date-fns';
import { useMemo } from 'react';
import { Area } from '@/components/charts/area';
import { AreaChart } from '@/components/charts/area-chart';
import { Grid } from '@/components/charts/grid';
import { ChartTooltip } from '@/components/charts/tooltip';
import { XAxis } from '@/components/charts/x-axis';
import { YAxis } from '@/components/charts/y-axis';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { CHART_ANIMATION_MS, CHART_COLORS, CHART_MARGIN } from '@/configs/chart-theme';
import { useSalesTrend } from '@/hooks/dashboard/useDashboardQueries';
import { useDashboardFiltersStore } from '@/states/dashboard-filters.store';
import type { DateRange, TrendGranularity } from '@/types/dashboard.types';
import { formatCompactCurrency, formatCount } from '@/utils/format';

const GRANULARITY_OPTIONS = [
  { value: 'day' as const, label: 'Day' },
  { value: 'month' as const, label: 'Month' },
];

interface SalesTrendChartProps {
  range: DateRange;
}

export function SalesTrendChart({ range }: SalesTrendChartProps) {
  const granularity = useDashboardFiltersStore((state) => state.granularity);
  const setGranularity = useDashboardFiltersStore((state) => state.setGranularity);
  const { data, isPending, isFetching, error, refetch } = useSalesTrend({ ...range, granularity });

  const points = useMemo(
    () => (data ?? []).map((point) => ({ date: parseISO(point.period), gmv: point.gmv, orders: point.orders })),
    [data]
  );

  return (
    <Panel
      title="Gross merchandise value"
      caption={granularity === 'month' ? 'by month' : 'by day'}
      actions={
        <SegmentedControl<TrendGranularity>
          label="Trend granularity"
          options={GRANULARITY_OPTIONS}
          value={granularity}
          onChange={setGranularity}
          accentId="granularity-signal"
          size="sm"
        />
      }
    >
      {error && points.length === 0 ? (
        <ErrorState error={error} title="The sales trend could not load" onRetry={() => void refetch()} />
      ) : !isPending && points.length === 0 ? (
        <EmptyState title="No orders in this period" description="Pick a wider range to see the trend." />
      ) : (
        <div
          aria-busy={isFetching}
          className="transition-opacity duration-200"
          style={{ opacity: isFetching && !isPending ? 0.7 : 1 }}
        >
          <AreaChart
            data={points}
            margin={CHART_MARGIN}
            aspectRatio="16 / 7"
            status={isPending ? 'loading' : 'ready'}
            loadingLabel="Loading trend"
            animationDuration={CHART_ANIMATION_MS}
            revealSignature={`${granularity}-${range.from ?? 'all'}-${range.to ?? 'all'}`}
          >
            <Grid horizontal numTicksRows={4} strokeDasharray="0" />
            <Area dataKey="gmv" fill={CHART_COLORS.primary} fillOpacity={0.16} strokeWidth={1.5} />
            {isPending ? null : <XAxis numTicks={6} />}
            {isPending ? null : <YAxis numTicks={4} formatValue={formatCompactCurrency} />}
            <ChartTooltip
              rows={(point) => [
                { color: CHART_COLORS.primary, label: 'GMV', value: formatCompactCurrency(point.gmv as number) },
                { color: CHART_COLORS.secondary, label: 'Orders', value: formatCount(point.orders as number) },
              ]}
            />
          </AreaChart>
        </div>
      )}
    </Panel>
  );
}
