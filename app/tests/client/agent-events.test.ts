import type { AgentChatEvent } from '@databricks/appkit-ui/react';
import { describe, expect, it } from 'vitest';
import type { AssistantToolItem } from '@/types/assistant.types';
import { resolveApprovalState, streamErrorOf, toAssistantItems } from '@/utils/agent-events';
import { parseToolResult } from '@/utils/agent-tool-results';

const call = (callId: string, name: string, args: object): AgentChatEvent => ({
  type: 'response.output_item.done',
  item: { type: 'function_call', call_id: callId, name, arguments: JSON.stringify(args) },
});

const output = (callId: string, value: string): AgentChatEvent => ({
  type: 'response.output_item.done',
  item: { type: 'function_call_output', call_id: callId, output: value },
});

const tool = (overrides: Partial<AssistantToolItem> = {}): AssistantToolItem => ({
  kind: 'tool',
  id: 'c1',
  name: 'create_product',
  args: {},
  output: null,
  approval: { approvalId: 'a1', streamId: 's1', effect: 'write' },
  ...overrides,
});

describe('toAssistantItems', () => {
  it('orders text and tool calls as they stream and attaches approvals to their call', () => {
    const events: AgentChatEvent[] = [
      { type: 'response.output_text.delta', item_id: 'm1', delta: 'Looking ' },
      { type: 'response.output_text.delta', item_id: 'm1', delta: 'it up' },
      call('c1', 'create_product', { displayName: 'Desk Lamp' }),
      {
        type: 'appkit.approval_pending',
        approval_id: 'a1',
        stream_id: 's1',
        tool_name: 'create_product',
        annotations: { effect: 'write' },
      },
      output('c1', '{"productId":"p1"}'),
      { type: 'response.output_text.delta', item_id: 'm2', delta: 'Done' },
    ];

    expect(toAssistantItems(events)).toEqual([
      { kind: 'text', id: 'm1', text: 'Looking it up' },
      {
        kind: 'tool',
        id: 'c1',
        name: 'create_product',
        args: { displayName: 'Desk Lamp' },
        output: '{"productId":"p1"}',
        approval: { approvalId: 'a1', streamId: 's1', effect: 'write' },
      },
      { kind: 'text', id: 'm2', text: 'Done' },
    ]);
  });

  it('prefers the final message text and drops empty messages', () => {
    const events = [
      { type: 'response.output_text.delta', item_id: 'm1', delta: 'Partial' },
      {
        type: 'response.output_item.done',
        item: { type: 'message', id: 'm1', content: [{ type: 'output_text', text: 'Final answer' }] },
      },
      { type: 'response.output_text.delta', item_id: 'm2', delta: '  ' },
    ] as AgentChatEvent[];

    expect(toAssistantItems(events)).toEqual([{ kind: 'text', id: 'm1', text: 'Final answer' }]);
  });

  it('reads the last stream error', () => {
    expect(
      streamErrorOf([
        { type: 'error', error: 'first' },
        { type: 'error', error: 'last' },
      ])
    ).toBe('last');
    expect(streamErrorOf([])).toBeNull();
  });
});

describe('resolveApprovalState', () => {
  it('is pending only while the stream that asked for it is open', () => {
    expect(resolveApprovalState(tool(), undefined, true)).toBe('pending');
    expect(resolveApprovalState(tool(), undefined, false)).toBe('expired');
  });

  it('follows the local decision until the tool answers', () => {
    expect(resolveApprovalState(tool(), 'submitting', true)).toBe('submitting');
    expect(resolveApprovalState(tool(), 'approve', true)).toBe('approved');
    expect(resolveApprovalState(tool(), 'deny', true)).toBe('denied');
  });

  it('treats a denial without a local decision as a timeout', () => {
    const denied = tool({ output: 'Tool execution denied by user approval gate (tool: create_product).' });
    expect(resolveApprovalState(denied, undefined, false)).toBe('expired');
    expect(resolveApprovalState(denied, 'deny', false)).toBe('denied');
    expect(resolveApprovalState(tool({ output: '{}' }), 'approve', false)).toBe('approved');
  });
});

describe('parseToolResult', () => {
  it('recognises denials, structured failures and unknown output', () => {
    expect(parseToolResult('create_product', 'Tool execution denied by user approval gate')).toEqual({
      kind: 'denied',
    });
    expect(
      parseToolResult('update_product', '{"error":{"code":"VERSION_CONFLICT","message":"Product changed"}}')
    ).toEqual({ kind: 'failure', code: 'VERSION_CONFLICT', message: 'Product changed' });
    expect(parseToolResult('get_kpi_summary', 'not json')).toEqual({ kind: 'none' });
    expect(parseToolResult('get_kpi_summary', null)).toEqual({ kind: 'none' });
  });

  it('extracts Genie query results and skips attachments without a query', () => {
    const genieOutput = JSON.stringify([
      { type: 'message_start', conversationId: 'c', messageId: 'm' },
      { type: 'status', status: 'COMPLETED' },
      {
        type: 'message_result',
        message: {
          attachments: [
            { attachmentId: 'q1', query: { description: 'Top categories', query: 'SELECT 1' } },
            { text: { content: 'Summary' } },
            { attachmentId: 's1', suggestedQuestions: ['Next?'] },
          ],
        },
      },
      { type: 'query_result', attachmentId: 'q1', statementId: 'st', data: { manifest: {} } },
    ]);

    expect(parseToolResult('ask_analytics', genieOutput)).toEqual({
      kind: 'analytics',
      results: [
        {
          attachmentId: 'q1',
          title: undefined,
          description: 'Top categories',
          sql: 'SELECT 1',
          statement: { manifest: {} },
        },
      ],
    });
  });
});
