import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { isApiError } from '@/api/http';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { EditProductForm } from '@/components/products/EditProductForm';
import { ProductActionDialog, type ProductAction } from '@/components/products/ProductActionDialog';
import { ProductStatus } from '@/components/products/ProductStatus';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes';
import { useReactivateProduct } from '@/hooks/products/useProductMutations';
import { useProduct } from '@/hooks/products/useProductQueries';
import type { Product } from '@/types/product.types';
import { formatDateTime, humanizeSlug } from '@/utils/format';

function BackLink() {
  return (
    <Link
      to={ROUTES.products}
      className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-3 transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-3.5" strokeWidth={1.75} />
      All products
    </Link>
  );
}

function ProductFacts({ product }: { product: Product }) {
  const facts = [
    { label: 'Product ID', value: product.productId },
    { label: 'Category', value: humanizeSlug(product.categoryEn) },
    { label: 'Source', value: product.source === 'app' ? 'Created in the app' : 'Imported from Olist' },
    { label: 'Created', value: formatDateTime(product.createdAt.replace(' ', 'T')) },
    { label: 'Last updated', value: formatDateTime(product.updatedAt.replace(' ', 'T')) },
    { label: 'Version', value: String(product.version) },
  ];

  return (
    <dl className="flex flex-col divide-y divide-hairline border-y border-hairline">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-baseline justify-between gap-6 py-3">
          <dt className="text-xs text-ink-3">{fact.label}</dt>
          <dd className="truncate text-right text-sm text-ink-2">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: product, isPending, error, refetch } = useProduct(productId);
  const reactivate = useReactivateProduct();
  const [action, setAction] = useState<ProductAction>(null);

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading product">
        <BackLink />
        <Skeleton className="mb-3 h-8 w-80" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (isApiError(error) && error.code === 'NOT_FOUND') {
    return (
      <>
        <BackLink />
        <EmptyState
          title="This product does not exist"
          description="It may have been deleted permanently, or the link is wrong."
          action={
            <Button asChild variant="outline">
              <Link to={ROUTES.products}>Back to products</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <BackLink />
        <ErrorState error={error} title="This product could not load" onRetry={() => void refetch()} />
      </>
    );
  }

  const runReactivate = async () => {
    try {
      await reactivate.mutateAsync(product);
      toast.success('Product reactivated', { description: product.displayName });
    } catch (reactivateError) {
      toast.error('Reactivate failed', {
        description: isApiError(reactivateError) ? reactivateError.message : undefined,
      });
    }
  };

  return (
    <>
      <BackLink />
      <PageHeader title={product.displayName} description={<ProductStatus isActive={product.isActive} />}>
        {product.isActive ? (
          <Button variant="outline" onClick={() => setAction({ kind: 'deactivate', product })}>
            Deactivate
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void runReactivate()} disabled={reactivate.isPending}>
            {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
          </Button>
        )}
        {product.source === 'app' ? (
          <Button
            variant="ghost"
            className="text-signal hover:text-signal"
            onClick={() => setAction({ kind: 'delete', product })}
          >
            Delete permanently
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,34rem)_minmax(0,22rem)] lg:justify-between">
        <section aria-label="Edit product">
          <EditProductForm product={product} />
        </section>
        <aside aria-label="Product facts">
          <ProductFacts product={product} />
        </aside>
      </div>

      <ProductActionDialog
        action={action}
        onClose={() => setAction(null)}
        onDeleted={() => void navigate(ROUTES.products, { replace: true })}
      />
    </>
  );
}
