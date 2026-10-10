import { Bar } from '@/components/charts/bar';
import { BarChart } from '@/components/charts/bar-chart';
import { BarYAxis } from '@/components/charts/bar-y-axis';
import { ChartTooltip } from '@/components/charts/tooltip';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { BAR_CHART_MARGIN, CHART_ANIMATION_MS, CHART_COLORS } from '@/configs/chart-theme';

export interface RankedBarDatum extends Record<string, unknown> {
  label: string;
  value: number;
  detail: string;
}

interface RankedBarChartProps {
  data: RankedBarDatum[];
  valueLabel: string;
  formatValue: (value: number) => string;
  detailLabel: string;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  emptyTitle: string;
  revealSignature: string;
  aspectRatio: string;
  labelWidth?: number;
}

const SKELETON_WIDTHS = ['92%', '84%', '76%', '70%', '62%', '55%', '48%', '40%'];

function RankedBarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading breakdown" className="flex flex-col gap-4 py-2">
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className="grid grid-cols-[116px_1fr] items-center gap-4">
          <Skeleton className="h-3 w-20 justify-self-end" />
          <Skeleton className="h-3" style={{ width }} />
        </div>
      ))}
    </div>
  );
}

export function RankedBarChart({
  data,
  valueLabel,
  formatValue,
  detailLabel,
  isPending,
  isFetching,
  error,
  onRetry,
  emptyTitle,
  revealSignature,
  aspectRatio,
  labelWidth = BAR_CHART_MARGIN.left,
}: RankedBarChartProps) {
  if (error && data.length === 0) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (isPending) {
    return <RankedBarSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description="Pick a wider range to see the breakdown." />;
  }

  return (
    <div aria-busy={isFetching} className="transition-opacity duration-200" style={{ opacity: isFetching ? 0.7 : 1 }}>
      <BarChart
        data={data}
        xDataKey="label"
        orientation="horizontal"
        margin={{ ...BAR_CHART_MARGIN, left: labelWidth }}
        aspectRatio={aspectRatio}
        barGap={0.72}
        animationDuration={CHART_ANIMATION_MS}
        revealSignature={revealSignature}
      >
        <Bar dataKey="value" fill={CHART_COLORS.bar} lineCap={1} fadedOpacity={0.28} />
        <BarYAxis />
        <ChartTooltip
          showCrosshair={false}
          showDatePill={false}
          rows={(point) => [
            { color: CHART_COLORS.primary, label: valueLabel, value: formatValue(point.value as number) },
            { color: CHART_COLORS.muted, label: detailLabel, value: point.detail as string },
          ]}
        />
      </BarChart>
    </div>
  );
}
