import { inferChartType, transformGenieData, useGenieChat } from '@databricks/appkit-ui/react';
import type { GenieMessageItem } from '@databricks/appkit-ui/react';
import { useMemo } from 'react';
import { GENIE_SPACE_ALIAS } from '@/configs/env';

export type ExploreChartKind = 'bar' | 'line';

export interface ExploreColumn {
  name: string;
  category: 'numeric' | 'date' | 'string';
}

export interface ExploreResult {
  attachmentId: string;
  title: string | null;
  description: string | null;
  sql: string | null;
  rows: Record<string, unknown>[];
  columns: ExploreColumn[];
  chart: { kind: ExploreChartKind; xKey: string; yKey: string } | null;
}

export interface ExploreMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status: string;
  error: string | null;
  results: ExploreResult[];
  pendingResults: number;
  suggestedQuestions: string[];
}

const CHART_KINDS: Record<string, ExploreChartKind> = { bar: 'bar', line: 'line', area: 'line' };

const toChart = (
  rows: Record<string, unknown>[],
  columns: ExploreColumn[],
  rawColumns: Parameters<typeof inferChartType>[1]
) => {
  const inference = inferChartType(rows, rawColumns);
  const kind = inference ? CHART_KINDS[inference.chartType] : undefined;
  const yKey = inference && (Array.isArray(inference.yKey) ? inference.yKey[0] : inference.yKey);
  if (!inference || !kind || !yKey || !columns.some((column) => column.name === inference.xKey)) {
    return null;
  }
  return { kind, xKey: inference.xKey, yKey };
};

const toMessage = (message: GenieMessageItem): ExploreMessage => {
  const queryAttachments = message.attachments.filter((attachment) => attachment.query && attachment.attachmentId);
  const results = queryAttachments.flatMap<ExploreResult>((attachment) => {
    const statement = message.queryResults.get(attachment.attachmentId ?? '');
    const transformed = transformGenieData(statement);
    if (!transformed) {
      return [];
    }
    const columns = transformed.columns.map(({ name, category }) => ({ name, category }));
    return [
      {
        attachmentId: attachment.attachmentId ?? '',
        title: attachment.query?.title ?? null,
        description: attachment.query?.description ?? null,
        sql: attachment.query?.query ?? null,
        rows: transformed.rows,
        columns,
        chart: toChart(transformed.rows, columns, transformed.columns),
      },
    ];
  });
  const textAttachments = message.attachments.flatMap((attachment) =>
    attachment.text?.content ? [attachment.text.content] : []
  );

  return {
    id: message.id,
    role: message.role,
    text: [message.content, ...textAttachments].filter(Boolean).join('\n\n'),
    status: message.status,
    error: message.error ?? null,
    results,
    pendingResults: Math.max(queryAttachments.length - results.length, 0),
    suggestedQuestions: message.attachments.flatMap((attachment) => attachment.suggestedQuestions ?? []),
  };
};

export const useExplore = () => {
  const chat = useGenieChat({ alias: GENIE_SPACE_ALIAS });
  const messages = useMemo(() => chat.messages.map(toMessage), [chat.messages]);

  return {
    messages,
    status: chat.status,
    error: chat.error,
    isStreaming: chat.status === 'streaming',
    isLoadingHistory: chat.status === 'loading-history',
    ask: chat.sendMessage,
    reset: chat.reset,
    hasOlderMessages: chat.hasPreviousPage,
    isFetchingOlder: chat.isFetchingPreviousPage,
    loadOlder: chat.fetchPreviousPage,
  };
};
