interface ChatSuggestionsProps {
  intro: string;
  suggestions: readonly string[];
  onPick: (suggestion: string) => void;
}

export function ChatSuggestions({ intro, suggestions, onPick }: ChatSuggestionsProps) {
  return (
    <div className="flex flex-col gap-4 py-6">
      <p className="text-sm text-ink-2">{intro}</p>
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              onClick={() => onPick(suggestion)}
              className="group flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm text-ink-2 transition-colors hover:text-ink"
            >
              {suggestion}
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
