import { PageHeader } from '@/components/common/PageHeader';
import { CategoryBreakdownChart } from '@/components/dashboard/CategoryBreakdownChart';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { StateSalesMap } from '@/components/dashboard/StateSalesMap';
import { TopProductsTable } from '@/components/dashboard/TopProductsTable';
import { TopSellersTable } from '@/components/dashboard/TopSellersTable';
import { useDashboardPeriod } from '@/hooks/dashboard/useDashboardPeriod';
import { useKpiReadings } from '@/hooks/dashboard/useKpiReadings';

export function DashboardPage() {
  const period = useDashboardPeriod();
  const kpis = useKpiReadings(period.range, period.comparison);

  return (
    <>
      <PageHeader
        title="Business overview"
        description={period.comparisonLabel ? `${period.label}, ${period.comparisonLabel}` : period.label}
      >
        <DashboardFilters customLabel={period.label} />
      </PageHeader>

      <KpiStrip
        readings={kpis.readings}
        largestMove={kpis.largestMove}
        comparisonLabel={period.comparisonLabel}
        isPending={kpis.isPending}
        isFetching={kpis.isFetching}
        error={kpis.error}
        onRetry={() => void kpis.refetch()}
      />

      <div className="mt-12 grid gap-x-12 gap-y-12 border-t border-hairline pt-8 xl:grid-cols-[2fr_1fr]">
        <SalesTrendChart range={period.range} />
        <CategoryBreakdownChart range={period.range} />
      </div>

      <div className="mt-12 border-t border-hairline pt-8">
        <StateSalesMap range={period.range} />
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-12 border-t border-hairline pt-8 xl:grid-cols-2">
        <TopProductsTable />
        <TopSellersTable />
      </div>
    </>
  );
}
