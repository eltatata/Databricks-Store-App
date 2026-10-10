import { motion } from 'motion/react';
import { SafeMarkdown } from '@/components/common/SafeMarkdown';
import { ShimmeringText } from '@/components/ui/shimmering-text';
import type { ExploreMessage as ExploreMessageData } from '@/hooks/explore/useExplore';
import { ExploreResult } from './ExploreResult';

const ENTER = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
} as const;

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Reading the question',
  FILTERING_CONTEXT: 'Finding the right tables',
  ASKING_AI: 'Writing the query',
  PENDING_WAREHOUSE: 'Waking up the SQL warehouse',
  EXECUTING_QUERY: 'Running the query',
  FETCHING_METADATA: 'Fetching results',
};

interface ExploreMessageProps {
  message: ExploreMessageData;
  isLatest: boolean;
  isStreaming: boolean;
  onAsk: (question: string) => void;
}

export function ExploreMessage({ message, isLatest, isStreaming, onAsk }: ExploreMessageProps) {
  if (message.role === 'user') {
    return (
      <motion.div {...ENTER} className="flex justify-end">
        <p className="max-w-[60ch] rounded-lg bg-raised-2 px-4 py-2.5 text-sm whitespace-pre-wrap text-ink">
          {message.text}
        </p>
      </motion.div>
    );
  }

  const working = isLatest && isStreaming;
  const statusLabel = STATUS_LABELS[message.status] ?? 'Thinking';

  return (
    <motion.article {...ENTER} className="flex flex-col gap-4">
      {message.text ? <SafeMarkdown text={message.text} /> : null}

      {working && !message.text ? <ShimmeringText text={statusLabel} className="text-sm" /> : null}

      {message.error ? (
        <p role="alert" className="flex items-center gap-2 text-sm text-ink-2">
          <span aria-hidden className="size-2 rounded-full bg-signal" />
          {message.error}
        </p>
      ) : null}

      {message.results.map((result) => (
        <ExploreResult key={result.attachmentId} result={result} />
      ))}

      {message.pendingResults > 0 && working ? (
        <ShimmeringText text="Loading the result table" className="text-xs" />
      ) : null}

      {isLatest && !working && message.suggestedQuestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {message.suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onAsk(question)}
              className="rounded-full border border-hairline px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-hairline-strong hover:text-ink"
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}
