import { AccentDot } from './AccentDot';
import { cn } from '@/lib/utils';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accentId: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  accentId,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex items-center gap-2 rounded-full border whitespace-nowrap transition-[color,border-color,background-color] duration-200 active:scale-[0.97]',
              size === 'md' ? 'h-9 px-3.5 text-[13px]' : 'h-7 px-2.5 text-xs',
              selected
                ? 'border-brand bg-brand-soft text-ink'
                : 'border-hairline text-ink-2 hover:border-hairline-strong hover:text-ink'
            )}
          >
            {selected ? <AccentDot layoutId={accentId} className="size-1.5" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
