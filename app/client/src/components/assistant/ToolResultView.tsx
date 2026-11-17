import { AnalyticsResult } from './AnalyticsResult';
import { buildAnalyticsResult } from '@/utils/analytics-result';
import { parseToolResult } from '@/utils/agent-tool-results';
import { KpiSummaryResult } from './KpiSummaryResult';
import { ProductResultLine, ProductResultTable } from './ProductResults';
import { StateSalesResult } from './StateSalesResult';

interface ToolResultViewProps {
  toolId: string;
  toolName: string;
  output: string | null;
}

export function ToolResultView({ toolId, toolName, output }: ToolResultViewProps) {
  const result = parseToolResult(toolName, output);

  switch (result.kind) {
    case 'failure':
      return (
        <p role="alert" className="flex items-center gap-2 text-sm text-ink-2">
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-signal" />
          {result.message}
        </p>
      );
    case 'kpis':
      return <KpiSummaryResult summary={result.summary} />;
    case 'states':
      return <StateSalesResult sales={result.sales} resultId={toolId} />;
    case 'products':
      return <ProductResultTable products={result.products} total={result.total} />;
    case 'product':
      return <ProductResultLine product={result.product} />;
    case 'analytics':
      return result.results.flatMap((source) => {
        const built = buildAnalyticsResult(source);
        return built ? [<AnalyticsResult key={built.attachmentId} result={built} />] : [];
      });
    default:
      return null;
  }
}
