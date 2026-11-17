import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { EmptyCatalog } from '@/components/products/EmptyCatalog';
import { ProductActionDialog, type ProductAction } from '@/components/products/ProductActionDialog';
import { ProductSheet, type ProductSheetState } from '@/components/products/ProductSheet';
import { ProductsPagination } from '@/components/products/ProductsPagination';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductsToolbar } from '@/components/products/ProductsToolbar';
import { Button } from '@/components/ui/button';
import { PRODUCTS_PAGE_SIZE, useProductListParams } from '@/hooks/products/useProductListParams';
import { useProducts } from '@/hooks/products/useProductQueries';
import { formatCount } from '@/utils/format';

export function ProductsPage() {
  const { state, params, update } = useProductListParams();
  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = useProducts(params);
  const [sheet, setSheet] = useState<ProductSheetState>({ mode: 'closed' });
  const [action, setAction] = useState<ProductAction>(null);
  const hasFilters = Boolean(params.search || params.category || params.active !== undefined);

  return (
    <>
      <PageHeader
        title="Products"
        description={
          data
            ? `${formatCount(data.meta.total)} ${data.meta.total === 1 ? 'product' : 'products'} in the catalog view`
            : 'Manage the store catalog'
        }
      >
        <Button onClick={() => setSheet({ mode: 'create' })}>
          <Plus strokeWidth={2} />
          New product
        </Button>
      </PageHeader>

      <ProductsToolbar state={state} onChange={update} />

      <div className="mt-6">
        {isPending ? (
          <TableSkeleton rows={10} label="Loading products" />
        ) : error && !data ? (
          <ErrorState error={error} title="Products could not load" onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyCatalog
            hasFilters={hasFilters}
            onClearFilters={() => update({ search: '', category: null, status: 'all' })}
          />
        ) : (
          <>
            <ProductsTable
              products={data.items}
              sortBy={state.sortBy}
              sortDirection={state.sortDirection}
              isRefreshing={isFetching && isPlaceholderData}
              onSort={(sortBy, sortDirection) => update({ sortBy, sortDirection })}
              onEdit={(product) => setSheet({ mode: 'edit', productId: product.productId })}
              onAction={setAction}
            />
            {data.meta.total > PRODUCTS_PAGE_SIZE ? (
              <ProductsPagination meta={data.meta} onPageChange={(page) => update({ page })} />
            ) : null}
          </>
        )}
      </div>

      <ProductSheet state={sheet} onClose={() => setSheet({ mode: 'closed' })} />
      <ProductActionDialog action={action} onClose={() => setAction(null)} />
    </>
  );
}
