import { useMemo } from 'react';
import { Panel } from '@/components/common/Panel';
import { CATEGORY_BREAKDOWN_LIMIT } from '@/configs/dashboard';
import { useCategoryBreakdown } from '@/hooks/dashboard/useDashboardQueries';
import type { DateRange } from '@/types/dashboard.types';
import { formatCompactCurrency, formatCount, humanizeSlug } from '@/utils/format';
import { RankedBarChart } from './RankedBarChart';

interface CategoryBreakdownChartProps {
  range: DateRange;
}

export function CategoryBreakdownChart({ range }: CategoryBreakdownChartProps) {
  const { data, isPending, isFetching, error, refetch } = useCategoryBreakdown({
    ...range,
    limit: CATEGORY_BREAKDOWN_LIMIT,
  });

  const rows = useMemo(
    () =>
      (data ?? []).map((row) => ({
        label: humanizeSlug(row.categoryEn),
        value: row.gmv,
        detail: `${formatCount(row.unitsSold)} units`,
      })),
    [data]
  );

  return (
    <Panel title="Top categories" caption="by GMV">
      <RankedBarChart
        data={rows}
        valueLabel="GMV"
        formatValue={formatCompactCurrency}
        detailLabel="Sold"
        isPending={isPending}
        isFetching={isFetching}
        error={error}
        onRetry={() => void refetch()}
        emptyTitle="No category sales in this period"
        revealSignature={`${range.from ?? 'all'}-${range.to ?? 'all'}`}
        aspectRatio="6 / 5"
      />
    </Panel>
  );
}
