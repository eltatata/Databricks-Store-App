import { ArrowUp } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ExploreComposerProps {
  disabled: boolean;
  onAsk: (question: string) => void;
}

const MAX_QUESTION_LENGTH = 1000;

export function ExploreComposer({ disabled, onAsk }: ExploreComposerProps) {
  const [question, setQuestion] = useState('');
  const trimmed = question.trim();

  const submit = () => {
    if (!trimmed || disabled) {
      return;
    }
    onAsk(trimmed);
    setQuestion('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-xl border border-hairline-strong bg-raised p-2 transition-colors focus-within:border-ink-3"
    >
      <Textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_QUESTION_LENGTH}
        rows={1}
        placeholder="Ask about sales, categories, sellers or deliveries"
        aria-label="Question for Genie"
        className="max-h-40 min-h-10 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="submit"
        size="icon"
        className="size-9 shrink-0 rounded-lg"
        disabled={!trimmed || disabled}
        aria-label="Ask Genie"
      >
        <ArrowUp strokeWidth={2} />
      </Button>
    </form>
  );
}
