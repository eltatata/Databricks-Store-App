import { ArrowUp } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatComposerProps {
  disabled: boolean;
  placeholder: string;
  inputLabel: string;
  submitLabel: string;
  onSubmit: (message: string) => void;
}

const MAX_MESSAGE_LENGTH = 2000;

export function ChatComposer({ disabled, placeholder, inputLabel, submitLabel, onSubmit }: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const trimmed = message.trim();

  const submit = () => {
    if (!trimmed || disabled) {
      return;
    }
    onSubmit(trimmed);
    setMessage('');
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
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={1}
        placeholder={placeholder}
        aria-label={inputLabel}
        className="max-h-40 min-h-10 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="submit"
        size="icon"
        className="size-9 shrink-0 rounded-lg"
        disabled={!trimmed || disabled}
        aria-label={submitLabel}
      >
        <ArrowUp strokeWidth={2} />
      </Button>
    </form>
  );
}
