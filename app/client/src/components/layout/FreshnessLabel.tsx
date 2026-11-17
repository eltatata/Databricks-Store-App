import { useFreshness } from '@/hooks/dashboard/useDashboardQueries';
import { formatIsoDate } from '@/utils/format';

export function FreshnessLabel() {
  const { data, isPending, isError } = useFreshness();

  if (isPending) {
    return <span className="h-4 w-36 animate-pulse rounded-sm bg-raised-2" aria-hidden />;
  }

  if (isError || !data?.lastOrderDate) {
    return <span className="text-xs text-ink-3">Data date unavailable</span>;
  }

  return (
    <span className="text-xs text-ink-3" title="Latest order date in the Gold layer synced to Lakebase">
      Data through <span className="text-ink-2">{formatIsoDate(data.lastOrderDate)}</span>
    </span>
  );
}
