import { RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AssistantTurn } from '@/components/assistant/AssistantTurn';
import { ChatComposer } from '@/components/common/ChatComposer';
import { ChatSuggestions } from '@/components/common/ChatSuggestions';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ASSISTANT_SUGGESTIONS } from '@/configs/assistant';
import { useAssistant } from '@/hooks/assistant/useAssistant';
import { cn } from '@/lib/utils';

const COLUMN = 'mx-auto w-full max-w-[880px] px-4 sm:px-6 lg:px-0';

export function AssistantPage() {
  const assistant = useAssistant();
  const historyRef = useRef<HTMLDivElement>(null);
  const lastTurn = assistant.turns.at(-1);

  useEffect(() => {
    const history = historyRef.current;
    history?.scrollTo({ top: history.scrollHeight, behavior: 'smooth' });
  }, [assistant.turns.length, lastTurn?.events.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={COLUMN}>
        <PageHeader
          title="Assistant"
          description="Ask about the business or change the catalog in plain words. Deeper analysis goes to Genie, and every change waits for your approval."
        >
          {assistant.turns.length > 0 ? (
            <Button variant="ghost" onClick={assistant.reset}>
              <RotateCcw strokeWidth={1.75} />
              New conversation
            </Button>
          ) : null}
        </PageHeader>
      </div>

      <div
        ref={historyRef}
        role="region"
        aria-label="Conversation history"
        tabIndex={-1}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain focus:outline-none"
      >
        <div className={cn(COLUMN, 'flex flex-col gap-10 pb-6')} aria-live="polite" aria-busy={assistant.isStreaming}>
          {assistant.turns.length === 0 ? (
            <ChatSuggestions
              intro="The assistant reads KPIs, state sales and products from Lakebase, hands trends and rankings to Genie, and answers with figures, charts and maps. It drafts catalog changes for you to approve."
              suggestions={ASSISTANT_SUGGESTIONS}
              onPick={assistant.send}
            />
          ) : (
            assistant.turns.map((turn) => {
              const isLast = turn.id === assistant.lastTurnId;
              return (
                <AssistantTurn
                  key={turn.id}
                  turn={turn}
                  isLive={isLast && assistant.isStreaming}
                  streamError={isLast ? assistant.error : null}
                  approvalStateOf={(tool) => assistant.approvalStateOf(tool, turn.id)}
                  onDecide={(tool, decision) => {
                    if (tool.approval) {
                      assistant.decide({
                        streamId: tool.approval.streamId,
                        approvalId: tool.approval.approvalId,
                        decision,
                      });
                    }
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      <div className={cn(COLUMN, 'relative shrink-0 pt-3 pb-6')}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-ground to-transparent"
        />
        <ChatComposer
          disabled={assistant.isStreaming}
          placeholder="Ask about KPIs, find a product, or describe a catalog change"
          inputLabel="Message for the assistant"
          submitLabel="Send to the assistant"
          onSubmit={assistant.send}
        />
        <p className="mt-2 text-center text-[11px] text-ink-3">
          The assistant can be wrong. Catalog changes run only after you approve them.
        </p>
      </div>
    </div>
  );
}
