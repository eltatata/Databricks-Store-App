import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows: number;
  label: string;
}

export function TableSkeleton({ rows, label }: TableSkeletonProps) {
  return (
    <div aria-busy="true" aria-label={label} className="flex flex-col">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-6 border-b border-hairline py-3">
          <Skeleton className="h-3.5 w-6" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
}
