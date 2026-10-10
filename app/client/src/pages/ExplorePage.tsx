import { RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ExploreComposer } from '@/components/explore/ExploreComposer';
import { ExploreMessage } from '@/components/explore/ExploreMessage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EXPLORE_SUGGESTIONS } from '@/configs/env';
import { useExplore } from '@/hooks/explore/useExplore';

function Suggestions({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <div className="flex flex-col gap-4 py-6">
      <p className="text-sm text-ink-2">Try one of these, or ask your own question.</p>
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {EXPLORE_SUGGESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onAsk(question)}
              className="group flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm text-ink-2 transition-colors hover:text-ink"
            >
              {question}
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-signal opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExplorePage() {
  const explore = useExplore();
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessage = explore.messages.at(-1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [explore.messages.length, lastMessage?.results.length, lastMessage?.text]);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-[880px] flex-col">
      <PageHeader
        title="Explore"
        description="Ask questions in plain English. Genie answers from the Gold tables in Unity Catalog."
      >
        {explore.messages.length > 0 ? (
          <Button variant="ghost" onClick={explore.reset} disabled={explore.isStreaming}>
            <RotateCcw strokeWidth={1.75} />
            New conversation
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-col gap-8 pb-6" aria-live="polite">
        {explore.hasOlderMessages ? (
          <Button
            variant="ghost"
            size="sm"
            className="self-center"
            onClick={explore.loadOlder}
            disabled={explore.isFetchingOlder}
          >
            {explore.isFetchingOlder ? 'Loading…' : 'Show earlier messages'}
          </Button>
        ) : null}

        {explore.isLoadingHistory ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading the conversation">
            <Skeleton className="h-10 w-2/3 self-end" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : explore.messages.length === 0 ? (
          <Suggestions onAsk={explore.ask} />
        ) : (
          explore.messages.map((message, index) => (
            <ExploreMessage
              key={message.id}
              message={message}
              isLatest={index === explore.messages.length - 1}
              isStreaming={explore.isStreaming}
              onAsk={explore.ask}
            />
          ))
        )}

        {explore.error && explore.status === 'error' ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-ink-2">
            <span aria-hidden className="size-2 rounded-full bg-signal" />
            {explore.error}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-ground from-70% to-transparent pt-6 pb-6">
        <ExploreComposer disabled={explore.isStreaming || explore.isLoadingHistory} onAsk={explore.ask} />
        <p className="mt-2 text-center text-[11px] text-ink-3">Genie can be wrong. Check the SQL behind each answer.</p>
      </div>
    </div>
  );
}
