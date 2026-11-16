import { RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AssistantTurn } from '@/components/assistant/AssistantTurn';
import { ChatComposer } from '@/components/common/ChatComposer';
import { ChatSuggestions } from '@/components/common/ChatSuggestions';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ASSISTANT_SUGGESTIONS } from '@/configs/assistant';
import { useAssistant } from '@/hooks/assistant/useAssistant';

export function AssistantPage() {
  const assistant = useAssistant();
  const endRef = useRef<HTMLDivElement>(null);
  const lastTurn = assistant.turns.at(-1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [assistant.turns.length, lastTurn?.events.length]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-[880px] flex-col">
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

      <div className="flex flex-col gap-10 pb-6" aria-live="polite" aria-busy={assistant.isStreaming}>
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
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-ground from-70% to-transparent pt-6 pb-6">
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
