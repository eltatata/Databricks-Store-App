import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isApiError } from '@/api/http';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

const describe = (error: unknown) => {
  if (isApiError(error)) {
    if (error.code === 'DB_UNAVAILABLE') {
      return 'Lakebase is not answering. It may be waking up; try again in a few seconds.';
    }
    if (error.code === 'NETWORK_ERROR') {
      return 'The app could not reach the server. Check your connection and try again.';
    }
    return error.message;
  }
  return 'Something unexpected happened while loading this view.';
};

export function ErrorState({ error, title = 'This view could not load', onRetry, className }: ErrorStateProps) {
  const requestId = isApiError(error) ? error.requestId : undefined;

  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3 py-8', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <span aria-hidden className="size-2 rounded-full bg-signal" />
        {title}
      </div>
      <p className="max-w-[60ch] text-sm text-ink-2">{describe(error)}</p>
      {requestId ? <p className="text-xs text-ink-3">Request {requestId}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw strokeWidth={1.75} />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
