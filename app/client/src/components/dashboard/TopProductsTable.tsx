import { Link } from 'react-router';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RANKING_TABLE_LIMIT } from '@/configs/dashboard';
import { productDetailPath } from '@/configs/routes';
import { useTopProducts } from '@/hooks/dashboard/useDashboardQueries';
import { useProductCategories } from '@/hooks/products/useProductQueries';
import { useDashboardFiltersStore } from '@/states/dashboard-filters.store';
import { formatCompactCurrency, formatCount, formatScore, humanizeSlug, shortId } from '@/utils/format';

const ALL_CATEGORIES = '__all__';

export function TopProductsTable() {
  const category = useDashboardFiltersStore((state) => state.topProductsCategory);
  const setCategory = useDashboardFiltersStore((state) => state.setTopProductsCategory);
  const categories = useProductCategories();
  const { data, isPending, error, refetch } = useTopProducts({
    limit: RANKING_TABLE_LIMIT,
    category: category ?? undefined,
  });

  return (
    <Panel
      title="Top products"
      caption="all time, by GMV"
      actions={
        <Select
          value={category ?? ALL_CATEGORIES}
          onValueChange={(value) => setCategory(value === ALL_CATEGORIES ? null : value)}
        >
          <SelectTrigger size="sm" aria-label="Filter top products by category" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {(categories.data ?? []).map((name) => (
              <SelectItem key={name} value={name}>
                {humanizeSlug(name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {isPending ? (
        <TableSkeleton rows={RANKING_TABLE_LIMIT} label="Loading top products" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data?.length ? (
        <EmptyState title="No products ranked in this category" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Review</TableHead>
              <TableHead className="text-right">GMV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.productId}>
                <TableCell className="text-ink-3">{row.gmvRank ?? index + 1}</TableCell>
                <TableCell className="max-w-[15rem]">
                  <Link to={productDetailPath(row.productId)} className="block truncate hover:underline">
                    {row.displayName ?? shortId(row.productId)}
                  </Link>
                  <span className="block truncate text-xs text-ink-3">{humanizeSlug(row.categoryEn)}</span>
                </TableCell>
                <TableCell className="text-right text-ink-2">{formatCount(row.unitsSold)}</TableCell>
                <TableCell className="text-right text-ink-2">{formatScore(row.averageReviewScore)}</TableCell>
                <TableCell className="text-right">{formatCompactCurrency(row.gmv)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
