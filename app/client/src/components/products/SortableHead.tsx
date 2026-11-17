import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ProductSortField, SortDirection } from '@/types/product.types';

interface SortableHeadProps {
  field: ProductSortField;
  label: string;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  onSort: (field: ProductSortField, direction: SortDirection) => void;
  align?: 'left' | 'right';
}

export function SortableHead({ field, label, sortBy, sortDirection, onSort, align = 'left' }: SortableHeadProps) {
  const active = sortBy === field;
  const Icon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  const nextDirection: SortDirection = active && sortDirection === 'asc' ? 'desc' : 'asc';

  return (
    <TableHead
      aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onSort(field, nextDirection)}
        className={cn(
          'inline-flex items-center gap-1 rounded-sm transition-colors hover:text-ink',
          active ? 'text-ink' : 'text-ink-3',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {label}
        <Icon aria-hidden className={cn('size-3', !active && 'opacity-50')} strokeWidth={2} />
      </button>
    </TableHead>
  );
}
