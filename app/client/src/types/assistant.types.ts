import type { AgentChatEvent } from '@databricks/appkit-ui/react';

export type ToolEffect = 'read' | 'write' | 'update' | 'destructive';

export type ApprovalDecision = 'approve' | 'deny';

export type ApprovalState = 'pending' | 'submitting' | 'approved' | 'denied' | 'expired';

export interface ToolApproval {
  approvalId: string;
  streamId: string;
  effect: ToolEffect;
}

export interface AssistantTextItem {
  kind: 'text';
  id: string;
  text: string;
}

export interface AssistantToolItem {
  kind: 'tool';
  id: string;
  name: string;
  args: Record<string, unknown>;
  output: string | null;
  approval: ToolApproval | null;
}

export type AssistantItem = AssistantTextItem | AssistantToolItem;

export interface AssistantTurn {
  id: string;
  prompt: string;
  events: AgentChatEvent[];
}

export interface ApprovalRequest {
  streamId: string;
  approvalId: string;
  decision: ApprovalDecision;
}
