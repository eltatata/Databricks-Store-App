import { cn } from '@/lib/utils';

interface ProductStatusProps {
  isActive: boolean;
  className?: string;
}

export function ProductStatus({ isActive, className }: ProductStatusProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', isActive ? 'text-ink-2' : 'text-ink-3', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', isActive ? 'bg-positive' : 'border border-ink-3')} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
