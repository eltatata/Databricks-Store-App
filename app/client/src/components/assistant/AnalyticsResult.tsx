import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { AnalyticsResult as AnalyticsResultData } from '@/types/analytics.types';
import { AnalyticsResultChart } from './AnalyticsResultChart';
import { AnalyticsResultTable } from './AnalyticsResultTable';
import { AnalyticsStateMap } from './AnalyticsStateMap';

type ResultView = 'chart' | 'table';

interface AnalyticsResultProps {
  result: AnalyticsResultData;
}

export function AnalyticsResult({ result }: AnalyticsResultProps) {
  const [view, setView] = useState<ResultView>(result.chart ? 'chart' : 'table');

  return (
    <figure className="flex flex-col gap-3 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <figcaption className="text-sm text-ink">{result.title ?? 'Query result'}</figcaption>
        {result.chart ? (
          <SegmentedControl<ResultView>
            label="Result view"
            options={[
              { value: 'chart', label: result.chart.kind === 'map' ? 'Map' : 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
            value={view}
            onChange={setView}
            accentId={`result-view-${result.attachmentId}`}
            size="sm"
          />
        ) : null}
      </div>
      {result.description ? <p className="max-w-[70ch] text-xs text-ink-3">{result.description}</p> : null}

      {view === 'chart' && result.chart?.kind === 'map' ? (
        <AnalyticsStateMap rows={result.rows} chart={result.chart} />
      ) : view === 'chart' && result.chart ? (
        <AnalyticsResultChart result={result} />
      ) : (
        <AnalyticsResultTable rows={result.rows} columns={result.columns} />
      )}

      {result.sql ? (
        <details className="group text-xs">
          <summary className="cursor-pointer text-ink-3 transition-colors select-none hover:text-ink">
            Show the SQL Genie ran
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-md border border-hairline bg-raised p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink-2">
            {result.sql}
          </pre>
        </details>
      ) : null}
    </figure>
  );
}
