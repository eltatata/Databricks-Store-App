import { Check, X } from 'lucide-react';
import { ShimmeringText } from '@/components/ui/shimmering-text';
import { toolLabelOf } from '@/configs/assistant';
import type { ApprovalDecision, ApprovalState, AssistantToolItem } from '@/types/assistant.types';
import { ApprovalCard } from './ApprovalCard';
import { ToolResultView } from './ToolResultView';

interface ToolActivityProps {
  tool: AssistantToolItem;
  isLive: boolean;
  approvalState: ApprovalState | null;
  onDecide: (decision: ApprovalDecision) => void;
}

const isWaitingOnUser = (state: ApprovalState | null) => state === 'pending' || state === 'submitting';

export function ToolActivity({ tool, isLive, approvalState, onDecide }: ToolActivityProps) {
  const isRunning = tool.output === null && isLive && !isWaitingOnUser(approvalState);
  const wasStopped = approvalState === 'denied' || approvalState === 'expired';
  const label = toolLabelOf(tool.name, isRunning);

  return (
    <div className="flex flex-col gap-3">
      {tool.approval && approvalState ? <ApprovalCard tool={tool} state={approvalState} onDecide={onDecide} /> : null}

      {isRunning ? (
        <ShimmeringText text={label} className="text-xs" />
      ) : tool.approval ? null : (
        <p className="flex items-center gap-1.5 text-xs text-ink-3">
          {wasStopped ? <X aria-hidden className="size-3" /> : <Check aria-hidden className="size-3" />}
          {label}
        </p>
      )}

      {wasStopped ? null : <ToolResultView toolName={tool.name} output={tool.output} />}
    </div>
  );
}
