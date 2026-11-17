import { z } from 'zod';
import type { AnalyticsResultSource } from '@/types/analytics.types';
import { DENIED_OUTPUT_PREFIX } from './agent-events';

const failureSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

const kpiSummarySchema = z.object({
  gmv: z.number(),
  orders: z.number(),
  itemsSold: z.number(),
  freight: z.number(),
  customers: z.number(),
  averageOrderValue: z.number().nullable(),
  averageReviewScore: z.number().nullable(),
  lateDeliveryRate: z.number().nullable(),
  firstOrderDate: z.string().nullable(),
  lastOrderDate: z.string().nullable(),
});

export const agentProductSchema = z.object({
  productId: z.string(),
  displayName: z.string(),
  categoryEn: z.string(),
  listPriceBrl: z.number().nullable(),
  weightG: z.number().nullable(),
  lengthCm: z.number().nullable(),
  heightCm: z.number().nullable(),
  widthCm: z.number().nullable(),
  isActive: z.boolean(),
  source: z.string(),
  version: z.number(),
});

const productSearchSchema = z.object({ total: z.number(), products: z.array(agentProductSchema) });

const salesByStateSchema = z.object({
  from: z.string().nullable(),
  to: z.string().nullable(),
  metric: z.enum(['gmv', 'orders', 'averageOrderValue', 'freight']).catch('gmv'),
  states: z.array(
    z.object({
      customerState: z.string(),
      gmv: z.number(),
      orders: z.number(),
      freight: z.number(),
      averageOrderValue: z.number().nullable(),
    })
  ),
});

const genieAttachmentSchema = z.object({
  attachmentId: z.string().optional(),
  query: z
    .object({ title: z.string().optional(), description: z.string().optional(), query: z.string().optional() })
    .optional(),
});

const genieEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message_result'),
    message: z.object({ attachments: z.array(genieAttachmentSchema).nullish() }),
  }),
  z.object({ type: z.literal('query_result'), attachmentId: z.string(), data: z.unknown() }),
  z.object({ type: z.literal('status'), status: z.string() }),
  z.object({ type: z.literal('message_start') }),
]);

export type AgentProduct = z.infer<typeof agentProductSchema>;
export type AgentKpiSummary = z.infer<typeof kpiSummarySchema>;
export type AgentSalesByState = z.infer<typeof salesByStateSchema>;

type ToolResult =
  | { kind: 'none' }
  | { kind: 'denied' }
  | { kind: 'failure'; code: string; message: string }
  | { kind: 'kpis'; summary: AgentKpiSummary }
  | { kind: 'states'; sales: AgentSalesByState }
  | { kind: 'products'; total: number; products: AgentProduct[] }
  | { kind: 'product'; product: AgentProduct }
  | { kind: 'analytics'; results: AnalyticsResultSource[] };

const PRODUCT_TOOLS = new Set(['get_product', 'create_product', 'update_product', 'deactivate_product']);

const parseJson = (output: string): unknown => {
  try {
    return JSON.parse(output) as unknown;
  } catch {
    return null;
  }
};

const toAnalyticsSources = (payload: unknown): AnalyticsResultSource[] => {
  if (!Array.isArray(payload)) {
    return [];
  }
  const events = payload.flatMap((entry) => {
    const parsed = genieEventSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
  const statements = new Map(
    events.flatMap((event) => (event.type === 'query_result' ? [[event.attachmentId, event.data] as const] : []))
  );
  const attachments = events.flatMap((event) =>
    event.type === 'message_result' ? (event.message.attachments ?? []) : []
  );
  return attachments.flatMap((attachment) =>
    attachment.query && attachment.attachmentId && statements.has(attachment.attachmentId)
      ? [
          {
            attachmentId: attachment.attachmentId,
            title: attachment.query.title,
            description: attachment.query.description,
            sql: attachment.query.query,
            statement: statements.get(attachment.attachmentId) as AnalyticsResultSource['statement'],
          },
        ]
      : []
  );
};

export const parseToolResult = (toolName: string, output: string | null): ToolResult => {
  if (output === null) {
    return { kind: 'none' };
  }
  if (output.startsWith(DENIED_OUTPUT_PREFIX)) {
    return { kind: 'denied' };
  }
  const payload = parseJson(output);
  const failure = failureSchema.safeParse(payload);
  if (failure.success) {
    return { kind: 'failure', ...failure.data.error };
  }
  if (toolName === 'get_kpi_summary') {
    const summary = kpiSummarySchema.safeParse(payload);
    return summary.success ? { kind: 'kpis', summary: summary.data } : { kind: 'none' };
  }
  if (toolName === 'get_sales_by_state') {
    const sales = salesByStateSchema.safeParse(payload);
    return sales.success ? { kind: 'states', sales: sales.data } : { kind: 'none' };
  }
  if (toolName === 'search_products') {
    const search = productSearchSchema.safeParse(payload);
    return search.success ? { kind: 'products', ...search.data } : { kind: 'none' };
  }
  if (PRODUCT_TOOLS.has(toolName)) {
    const product = agentProductSchema.safeParse(payload);
    return product.success ? { kind: 'product', product: product.data } : { kind: 'none' };
  }
  if (toolName === 'ask_analytics') {
    const results = toAnalyticsSources(payload);
    return results.length > 0 ? { kind: 'analytics', results } : { kind: 'none' };
  }
  return { kind: 'none' };
};
