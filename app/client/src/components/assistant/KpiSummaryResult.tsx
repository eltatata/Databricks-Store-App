import type { AgentKpiSummary } from '@/utils/agent-tool-results';
import { formatCount, formatCurrency, formatIsoDate, formatPercent, formatScore } from '@/utils/format';

interface KpiSummaryResultProps {
  summary: AgentKpiSummary;
}

export function KpiSummaryResult({ summary }: KpiSummaryResultProps) {
  const figures = [
    { label: 'GMV', value: formatCurrency(summary.gmv) },
    { label: 'Orders', value: formatCount(summary.orders) },
    { label: 'Average order value', value: formatCurrency(summary.averageOrderValue) },
    { label: 'Customers', value: formatCount(summary.customers) },
    { label: 'Average review', value: formatScore(summary.averageReviewScore) },
    { label: 'Late deliveries', value: formatPercent(summary.lateDeliveryRate) },
  ];

  return (
    <figure className="flex flex-col gap-3 border-t border-hairline pt-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-1">
            <dt className="text-xs text-ink-3">{figure.label}</dt>
            <dd className="font-condensed text-2xl leading-none font-light tracking-[-0.03em] text-ink tabular-nums">
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>
      <figcaption className="text-xs text-ink-3">
        Orders placed from {formatIsoDate(summary.firstOrderDate)} to {formatIsoDate(summary.lastOrderDate)}, read from
        Lakebase
      </figcaption>
    </figure>
  );
}
