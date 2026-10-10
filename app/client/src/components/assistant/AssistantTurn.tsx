import { motion } from 'motion/react';
import { useMemo } from 'react';
import { SafeMarkdown } from '@/components/common/SafeMarkdown';
import { ShimmeringText } from '@/components/ui/shimmering-text';
import type {
  ApprovalDecision,
  ApprovalState,
  AssistantToolItem,
  AssistantTurn as AssistantTurnData,
} from '@/types/assistant.types';
import { streamErrorOf, toAssistantItems } from '@/utils/agent-events';
import { ToolActivity } from './ToolActivity';

const ENTER = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
} as const;

interface AssistantTurnProps {
  turn: AssistantTurnData;
  isLive: boolean;
  streamError: string | null;
  approvalStateOf: (tool: AssistantToolItem) => ApprovalState;
  onDecide: (tool: AssistantToolItem, decision: ApprovalDecision) => void;
}

export function AssistantTurn({ turn, isLive, streamError, approvalStateOf, onDecide }: AssistantTurnProps) {
  const items = useMemo(() => toAssistantItems(turn.events), [turn.events]);
  const error = streamErrorOf(turn.events) ?? streamError;

  return (
    <div className="flex flex-col gap-6">
      <motion.div {...ENTER} className="flex justify-end">
        <p className="max-w-[60ch] rounded-lg bg-raised-2 px-4 py-2.5 text-sm whitespace-pre-wrap text-ink">
          {turn.prompt}
        </p>
      </motion.div>

      <motion.article {...ENTER} className="flex flex-col gap-5">
        {items.map((item) =>
          item.kind === 'text' ? (
            <SafeMarkdown key={item.id} text={item.text} />
          ) : (
            <ToolActivity
              key={item.id}
              tool={item}
              isLive={isLive}
              approvalState={item.approval ? approvalStateOf(item) : null}
              onDecide={(decision) => onDecide(item, decision)}
            />
          )
        )}

        {isLive && items.length === 0 ? <ShimmeringText text="Thinking" className="text-sm" /> : null}

        {error && !isLive ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-ink-2">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-signal" />
            The assistant stopped before finishing. Try again in a moment.
          </p>
        ) : null}
      </motion.article>
    </div>
  );
}
