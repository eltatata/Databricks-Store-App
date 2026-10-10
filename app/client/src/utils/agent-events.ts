import type { AgentChatEvent } from '@databricks/appkit-ui/react';
import { z } from 'zod';
import type {
  ApprovalState,
  AssistantItem,
  AssistantTextItem,
  AssistantToolItem,
  ToolEffect,
} from '@/types/assistant.types';

export const DENIED_OUTPUT_PREFIX = 'Tool execution denied';

const ITEM_EVENTS = new Set(['response.output_item.added', 'response.output_item.done']);
const TOOL_EFFECTS = ['read', 'write', 'update', 'destructive'] as const;

const messageItemSchema = z.object({
  type: z.literal('message'),
  id: z.string(),
  content: z.array(z.object({ text: z.string().optional() })).optional(),
});

const functionCallItemSchema = z.object({
  type: z.literal('function_call'),
  call_id: z.string(),
  name: z.string(),
  arguments: z.string().optional(),
});

const functionCallOutputItemSchema = z.object({
  type: z.literal('function_call_output'),
  call_id: z.string(),
  output: z.unknown(),
});

const approvalEventSchema = z.object({
  approval_id: z.string(),
  stream_id: z.string(),
  tool_name: z.string(),
  annotations: z.object({ effect: z.enum(TOOL_EFFECTS).optional() }).optional(),
});

const parseArguments = (raw: string | undefined): Record<string, unknown> => {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const toOutputText = (output: unknown): string => (typeof output === 'string' ? output : JSON.stringify(output));

export const toAssistantItems = (events: readonly AgentChatEvent[]): AssistantItem[] => {
  const items: AssistantItem[] = [];
  const texts = new Map<string, AssistantTextItem>();
  const tools = new Map<string, AssistantToolItem>();

  const textItem = (id: string) => {
    const existing = texts.get(id);
    if (existing) {
      return existing;
    }
    const created: AssistantTextItem = { kind: 'text', id, text: '' };
    texts.set(id, created);
    items.push(created);
    return created;
  };

  const toolItem = (callId: string, name: string) => {
    const existing = tools.get(callId);
    if (existing) {
      return existing;
    }
    const created: AssistantToolItem = { kind: 'tool', id: callId, name, args: {}, output: null, approval: null };
    tools.set(callId, created);
    items.push(created);
    return created;
  };

  events.forEach((event) => {
    if (event.type === 'response.output_text.delta' && event.item_id && typeof event.delta === 'string') {
      textItem(event.item_id).text += event.delta;
      return;
    }
    if (event.type === 'appkit.approval_pending') {
      const approval = approvalEventSchema.safeParse(event);
      if (!approval.success) {
        return;
      }
      const target = [...tools.values()]
        .reverse()
        .find((tool) => tool.name === approval.data.tool_name && tool.approval === null);
      if (target) {
        const effect: ToolEffect = approval.data.annotations?.effect ?? 'write';
        target.approval = { approvalId: approval.data.approval_id, streamId: approval.data.stream_id, effect };
      }
      return;
    }
    if (!ITEM_EVENTS.has(event.type)) {
      return;
    }
    const message = messageItemSchema.safeParse(event.item);
    if (message.success) {
      const item = textItem(message.data.id);
      const finalText = message.data.content?.map((part) => part.text ?? '').join('');
      if (event.type === 'response.output_item.done' && finalText) {
        item.text = finalText;
      }
      return;
    }
    const call = functionCallItemSchema.safeParse(event.item);
    if (call.success) {
      const item = toolItem(call.data.call_id, call.data.name);
      item.args = parseArguments(call.data.arguments);
      return;
    }
    const output = functionCallOutputItemSchema.safeParse(event.item);
    if (output.success) {
      const item = tools.get(output.data.call_id);
      if (item) {
        item.output = toOutputText(output.data.output);
      }
    }
  });

  return items.filter((item) => item.kind === 'tool' || item.text.trim() !== '');
};

export const streamErrorOf = (events: readonly AgentChatEvent[]): string | null => {
  const failure = [...events].reverse().find((event) => event.type === 'error' && typeof event.error === 'string');
  return failure?.error ?? null;
};

export type LocalApproval = 'submitting' | 'approve' | 'deny';

export const resolveApprovalState = (
  tool: AssistantToolItem,
  local: LocalApproval | undefined,
  isStreamOpen: boolean
): ApprovalState => {
  if (local === 'submitting') {
    return 'submitting';
  }
  const denied = tool.output?.startsWith(DENIED_OUTPUT_PREFIX) ?? false;
  if (tool.output !== null) {
    if (!denied) {
      return 'approved';
    }
    return local === 'deny' ? 'denied' : 'expired';
  }
  if (local === 'approve') {
    return 'approved';
  }
  if (local === 'deny') {
    return 'denied';
  }
  return isStreamOpen ? 'pending' : 'expired';
};
