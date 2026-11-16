import { useMemo } from 'react';
import { BrazilStateMap } from '@/components/common/BrazilStateMap';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { StateMetricSwitch } from '@/components/common/StateMetricSwitch';
import { Skeleton } from '@/components/ui/skeleton';
import { STATE_BREAKDOWN_LIMIT } from '@/configs/dashboard';
import { useStateMetric } from '@/hooks/common/useStateMetric';
import { useStateBreakdown } from '@/hooks/dashboard/useDashboardQueries';
import type { DateRange } from '@/types/dashboard.types';
import { RankedBarChart } from './RankedBarChart';

interface StateSalesMapProps {
  range: DateRange;
}

export function StateSalesMap({ range }: StateSalesMapProps) {
  const { data: rows, isPending, isFetching, error, refetch } = useStateBreakdown(range);
  const { metric, setMetric, definition, data, detailLabel, formatValue } = useStateMetric(rows ?? []);
  const ranking = useMemo(
    () =>
      data
        .slice(0, STATE_BREAKDOWN_LIMIT)
        .map((datum) => ({ label: datum.state, value: datum.value, detail: datum.detail ?? '' })),
    [data]
  );
  const revealSignature = `${range.from ?? 'all'}-${range.to ?? 'all'}-${metric}`;

  return (
    <Panel
      title="Customer states"
      caption={`${definition.label} by state and the top ${STATE_BREAKDOWN_LIMIT}`}
      actions={<StateMetricSwitch value={metric} onChange={setMetric} accentId="dashboard-state-metric" />}
    >
      {error && data.length === 0 ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton aria-label="Loading the state map" className="aspect-square w-full max-w-[560px]" />
      ) : data.length === 0 ? (
        <EmptyState title="No state sales in this period" description="Pick a wider range to see the map." />
      ) : (
        <div
          aria-busy={isFetching}
          className="grid items-start gap-x-12 gap-y-8 transition-opacity duration-200 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
          style={{ opacity: isFetching ? 0.7 : 1 }}
        >
          <BrazilStateMap
            data={data}
            valueLabel={definition.label}
            formatValue={formatValue}
            detailLabel={detailLabel}
            revealSignature={revealSignature}
            className="w-full max-w-[560px]"
          />
          <RankedBarChart
            data={ranking}
            valueLabel={definition.label}
            formatValue={formatValue}
            detailLabel={detailLabel}
            isPending={false}
            isFetching={false}
            error={null}
            onRetry={() => void refetch()}
            emptyTitle="No state sales in this period"
            revealSignature={revealSignature}
            aspectRatio="5 / 6"
            labelWidth={40}
          />
        </div>
      )}
    </Panel>
  );
}
