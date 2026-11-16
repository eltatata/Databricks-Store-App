import type { transformGenieData } from '@databricks/appkit-ui/react';

export type AnalyticsChartKind = 'bar' | 'line' | 'map';

export interface AnalyticsColumn {
  name: string;
  category: 'numeric' | 'date' | 'string';
}

export interface AnalyticsChart {
  kind: AnalyticsChartKind;
  xKey: string;
  yKey: string;
}

export interface AnalyticsResult {
  attachmentId: string;
  title: string | null;
  description: string | null;
  sql: string | null;
  rows: Record<string, unknown>[];
  columns: AnalyticsColumn[];
  chart: AnalyticsChart | null;
}

export interface AnalyticsResultSource {
  attachmentId: string;
  title?: string | null;
  description?: string | null;
  sql?: string | null;
  statement: Parameters<typeof transformGenieData>[0];
}
