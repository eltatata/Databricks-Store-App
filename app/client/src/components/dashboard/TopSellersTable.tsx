import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RANKING_TABLE_LIMIT } from '@/configs/dashboard';
import { useTopSellers } from '@/hooks/dashboard/useDashboardQueries';
import { formatCompactCurrency, formatCount, formatPercent, shortId } from '@/utils/format';

export function TopSellersTable() {
  const { data, isPending, error, refetch } = useTopSellers(RANKING_TABLE_LIMIT);

  return (
    <Panel title="Top sellers" caption="all time, by GMV">
      {isPending ? (
        <TableSkeleton rows={RANKING_TABLE_LIMIT} label="Loading top sellers" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title="No sellers ranked yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Late</TableHead>
              <TableHead className="text-right">GMV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.sellerId}>
                <TableCell className="text-ink-3">{row.gmvRank ?? index + 1}</TableCell>
                <TableCell title={row.sellerId}>{shortId(row.sellerId, 10)}</TableCell>
                <TableCell className="text-ink-2">{row.sellerState ?? '—'}</TableCell>
                <TableCell className="text-right text-ink-2">{formatCount(row.orders)}</TableCell>
                <TableCell className="text-right text-ink-2">{formatPercent(row.lateDeliveryRate)}</TableCell>
                <TableCell className="text-right">{formatCompactCurrency(row.gmv)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
