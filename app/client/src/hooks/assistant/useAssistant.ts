import { type AgentChatEvent, useAgentChat } from '@databricks/appkit-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ASSISTANT_AGENT, MUTATING_TOOLS } from '@/configs/assistant';
import { productKeys } from '@/hooks/products/products.keys';
import { assistantService } from '@/services/assistant.service';
import type { ApprovalRequest, AssistantToolItem, AssistantTurn } from '@/types/assistant.types';
import { DENIED_OUTPUT_PREFIX, type LocalApproval, resolveApprovalState } from '@/utils/agent-events';

const callIdOf = (event: AgentChatEvent) => event.item?.call_id;

export const useAssistant = () => {
  const queryClient = useQueryClient();
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [localApprovals, setLocalApprovals] = useState<Record<string, LocalApproval>>({});
  const activeTurnId = useRef<string | null>(null);
  const mutatingCalls = useRef(new Set<string>());

  const trackMutation = useCallback(
    (event: AgentChatEvent) => {
      const callId = callIdOf(event);
      if (!callId || event.type !== 'response.output_item.done') {
        return;
      }
      if (event.item?.type === 'function_call' && MUTATING_TOOLS.has(event.item.name ?? '')) {
        mutatingCalls.current.add(callId);
      }
      const succeeded =
        event.item?.type === 'function_call_output' &&
        mutatingCalls.current.has(callId) &&
        !String(event.item.output ?? '').startsWith(DENIED_OUTPUT_PREFIX);
      if (succeeded) {
        void queryClient.invalidateQueries({ queryKey: productKeys.all });
      }
    },
    [queryClient]
  );

  const chat = useAgentChat({
    agent: ASSISTANT_AGENT,
    onEvent: (event) => {
      const turnId = activeTurnId.current;
      if (!turnId) {
        return;
      }
      setTurns((current) =>
        current.map((turn) => (turn.id === turnId ? { ...turn, events: [...turn.events, event] } : turn))
      );
      trackMutation(event);
    },
  });

  const send = (prompt: string) => {
    const id = crypto.randomUUID();
    activeTurnId.current = id;
    setTurns((current) => [...current, { id, prompt, events: [] }]);
    void chat.send(prompt);
  };

  const reset = () => {
    chat.reset();
    activeTurnId.current = null;
    mutatingCalls.current.clear();
    setTurns([]);
    setLocalApprovals({});
  };

  const setLocalApproval = (approvalId: string, value: LocalApproval | null) =>
    setLocalApprovals((current) => {
      const { [approvalId]: _previous, ...rest } = current;
      return value ? { ...rest, [approvalId]: value } : rest;
    });

  const decision = useMutation({
    mutationFn: assistantService.decide,
    onMutate: (request: ApprovalRequest) => setLocalApproval(request.approvalId, 'submitting'),
    onSuccess: (_result, request) => setLocalApproval(request.approvalId, request.decision),
    onError: (_error, request) => {
      setLocalApproval(request.approvalId, null);
      toast.error('The decision could not be sent. The request may have expired.');
    },
  });

  const lastTurnId = turns.at(-1)?.id;

  const approvalStateOf = (tool: AssistantToolItem, turnId: string) =>
    resolveApprovalState(
      tool,
      tool.approval ? localApprovals[tool.approval.approvalId] : undefined,
      chat.isStreaming && turnId === lastTurnId
    );

  return {
    turns,
    lastTurnId,
    isStreaming: chat.isStreaming,
    error: chat.error,
    send,
    reset,
    decide: decision.mutate,
    approvalStateOf,
  };
};
