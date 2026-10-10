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

const CHART_KINDS: Record<string, ExploreChartKind> = {
  bar: 'bar',
  pie: 'bar',
  donut: 'bar',
  line: 'line',
  area: 'line',
};

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

export interface ExploreResultSource {
  attachmentId: string;
  title?: string | null;
  description?: string | null;
  sql?: string | null;
  statement: Parameters<typeof transformGenieData>[0];
}

export const buildExploreResult = (source: ExploreResultSource): ExploreResult | null => {
  const transformed = transformGenieData(source.statement);
  if (!transformed) {
    return null;
  }
  const columns = transformed.columns.map(({ name, category }) => ({ name, category }));
  return {
    attachmentId: source.attachmentId,
    title: source.title ?? null,
    description: source.description ?? null,
    sql: source.sql ?? null,
    rows: transformed.rows,
    columns,
    chart: toChart(transformed.rows, columns, transformed.columns),
  };
};

const toMessage = (message: GenieMessageItem): ExploreMessage => {
  const queryAttachments = message.attachments.filter((attachment) => attachment.query && attachment.attachmentId);
  const results = queryAttachments.flatMap<ExploreResult>((attachment) => {
    const result = buildExploreResult({
      attachmentId: attachment.attachmentId ?? '',
      title: attachment.query?.title,
      description: attachment.query?.description,
      sql: attachment.query?.query,
      statement: message.queryResults.get(attachment.attachmentId ?? ''),
    });
    return result ? [result] : [];
  });
  const textAttachments = message.attachments.flatMap((attachment) =>
    attachment.text?.content ? [attachment.text.content] : []
  );

  return {
    id: message.id,
    role: message.role,
    text: [...new Set([message.content, ...textAttachments].map((part) => part.trim()).filter(Boolean))].join('\n\n'),
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
