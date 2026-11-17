import { LayoutGroup } from 'motion/react';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { KPI_DEFINITIONS } from '@/configs/dashboard';
import { cn } from '@/lib/utils';
import type { KpiKey, KpiReading } from '@/types/dashboard.types';
import { KpiFigure } from './KpiFigure';

interface KpiStripProps {
  readings: KpiReading[];
  largestMove: KpiKey | null;
  comparisonLabel: string | null;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

const STRIP_GRID = 'grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-3 xl:grid-cols-[1.9fr_repeat(5,1fr)]';

function KpiStripSkeleton() {
  return (
    <div className={STRIP_GRID} aria-busy="true" aria-label="Loading key indicators">
      {KPI_DEFINITIONS.map((definition, index) => (
        <div
          key={definition.key}
          className={cn('flex flex-col gap-3', index === 0 && 'col-span-2 md:col-span-3 xl:col-span-1')}
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className={index === 0 ? 'h-16 w-64' : 'h-9 w-28'} />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function KpiStrip({
  readings,
  largestMove,
  comparisonLabel,
  isPending,
  isFetching,
  error,
  onRetry,
}: KpiStripProps) {
  if (isPending) {
    return <KpiStripSkeleton />;
  }

  if (error && readings.length === 0) {
    return <ErrorState error={error} title="Key indicators could not load" onRetry={onRetry} />;
  }

  return (
    <LayoutGroup id="kpis">
      <dl
        aria-busy={isFetching}
        className={cn(STRIP_GRID, 'transition-opacity duration-200', isFetching && 'opacity-70')}
      >
        {readings.map((reading, index) => (
          <div
            key={reading.definition.key}
            className={cn(
              index === 0 && 'col-span-2 md:col-span-3 xl:col-span-1',
              index > 0 && 'xl:border-l xl:border-hairline xl:pl-8'
            )}
          >
            <KpiFigure
              reading={reading}
              isLargestMove={reading.definition.key === largestMove}
              comparisonLabel={comparisonLabel}
              variant={index === 0 ? 'hero' : 'standard'}
            />
          </div>
        ))}
      </dl>
    </LayoutGroup>
  );
}
