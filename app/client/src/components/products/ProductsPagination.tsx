import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/types/api.types';
import { formatCount } from '@/utils/format';

interface ProductsPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function ProductsPagination({ meta, onPageChange }: ProductsPaginationProps) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4">
      <p className="text-xs text-ink-3">
        {formatCount(first)}–{formatCount(last)} of {formatCount(meta.total)} products
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-3">
          Page {formatCount(meta.page)} of {formatCount(Math.max(meta.totalPages, 1))}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft strokeWidth={1.75} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Next page"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRight strokeWidth={1.75} />
        </Button>
      </div>
    </nav>
  );
}
