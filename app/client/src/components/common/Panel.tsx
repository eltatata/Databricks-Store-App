import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title: string;
  caption?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, caption, actions, className, children }: PanelProps) {
  return (
    <section aria-label={title} className={cn('flex min-w-0 flex-col', className)}>
      <div className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
          {caption ? <span className="text-xs text-ink-3">{caption}</span> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
