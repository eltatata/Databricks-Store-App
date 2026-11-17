import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConflictNoticeProps {
  onReload: () => void;
}

export function ConflictNotice({ onReload }: ConflictNoticeProps) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-md border border-signal/40 bg-signal-soft px-4 py-3">
      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-signal" />
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-sm text-ink">Someone else saved this product while you were editing.</p>
        <p className="text-xs text-ink-2">Reload to get the latest version, then apply your changes again.</p>
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={onReload}>
          <RotateCw strokeWidth={1.75} />
          Reload product
        </Button>
      </div>
    </div>
  );
}
