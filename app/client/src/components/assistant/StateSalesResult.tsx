import { BrazilStateMap } from '@/components/common/BrazilStateMap';
import { StateMetricSwitch } from '@/components/common/StateMetricSwitch';
import { useStateMetric } from '@/hooks/common/useStateMetric';
import type { AgentSalesByState } from '@/utils/agent-tool-results';
import { formatIsoDate } from '@/utils/format';

interface StateSalesResultProps {
  sales: AgentSalesByState;
  resultId: string;
}

const rangeCaption = ({ from, to }: AgentSalesByState) =>
  from || to
    ? `Orders placed from ${formatIsoDate(from)} to ${formatIsoDate(to)}, read from Lakebase`
    : 'All orders in the dataset, read from Lakebase';

export function StateSalesResult({ sales, resultId }: StateSalesResultProps) {
  const { metric, setMetric, definition, data, detailLabel, formatValue } = useStateMetric(sales.states, sales.metric);

  if (data.length === 0) {
    return <p className="border-t border-hairline pt-4 text-sm text-ink-3">No state sales in this period.</p>;
  }

  return (
    <section aria-label="Sales by state" className="flex flex-col gap-4 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink">{definition.label} by state</p>
        <StateMetricSwitch value={metric} onChange={setMetric} accentId={`state-metric-${resultId}`} />
      </div>
      <BrazilStateMap
        data={data}
        valueLabel={definition.label}
        formatValue={formatValue}
        detailLabel={detailLabel}
        revealSignature={metric}
        className="w-full max-w-[520px] self-center"
      />
      <p className="text-xs text-ink-3">{rangeCaption(sales)}</p>
    </section>
  );
}
