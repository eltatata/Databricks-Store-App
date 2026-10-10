import { useMemo } from 'react';
import { Panel } from '@/components/common/Panel';
import { STATE_BREAKDOWN_LIMIT } from '@/configs/dashboard';
import { useStateBreakdown } from '@/hooks/dashboard/useDashboardQueries';
import type { DateRange } from '@/types/dashboard.types';
import { formatCompactCurrency, formatCount } from '@/utils/format';
import { RankedBarChart } from './RankedBarChart';

interface StateBreakdownChartProps {
  range: DateRange;
}

export function StateBreakdownChart({ range }: StateBreakdownChartProps) {
  const { data, isPending, isFetching, error, refetch } = useStateBreakdown(range);

  const rows = useMemo(
    () =>
      (data ?? []).slice(0, STATE_BREAKDOWN_LIMIT).map((row) => ({
        label: row.customerState,
        value: row.gmv,
        detail: `${formatCount(row.orders)} orders`,
      })),
    [data]
  );

  return (
    <Panel title="Customer states" caption={`top ${STATE_BREAKDOWN_LIMIT} by GMV`}>
      <RankedBarChart
        data={rows}
        valueLabel="GMV"
        formatValue={formatCompactCurrency}
        detailLabel="Orders"
        isPending={isPending}
        isFetching={isFetching}
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="No state sales in this period"
        revealSignature={`${range.from ?? 'all'}-${range.to ?? 'all'}`}
        aspectRatio="6 / 5"
        labelWidth={40}
      />
    </Panel>
  );
}
