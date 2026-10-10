import { ExploreResult } from '@/components/explore/ExploreResult';
import { buildExploreResult } from '@/hooks/explore/useExplore';
import { parseToolResult } from '@/utils/agent-tool-results';
import { KpiSummaryResult } from './KpiSummaryResult';
import { ProductResultLine, ProductResultTable } from './ProductResults';

interface ToolResultViewProps {
  toolName: string;
  output: string | null;
}

export function ToolResultView({ toolName, output }: ToolResultViewProps) {
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
    case 'products':
      return <ProductResultTable products={result.products} total={result.total} />;
    case 'product':
      return <ProductResultLine product={result.product} />;
    case 'analytics':
      return result.results.flatMap((source) => {
        const built = buildExploreResult(source);
        return built ? [<ExploreResult key={built.attachmentId} result={built} />] : [];
      });
    default:
      return null;
  }
}
