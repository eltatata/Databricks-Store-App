import { Link } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { productDetailPath } from '@/configs/routes';
import { cn } from '@/lib/utils';
import type { Product, ProductSortField, SortDirection } from '@/types/product.types';
import { formatCount, formatCurrency, formatIsoDate, humanizeSlug } from '@/utils/format';
import type { ProductAction } from './ProductActionDialog';
import { ProductRowActions } from './ProductRowActions';
import { ProductStatus } from './ProductStatus';
import { SortableHead } from './SortableHead';

interface ProductsTableProps {
  products: Product[];
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  isRefreshing: boolean;
  onSort: (field: ProductSortField, direction: SortDirection) => void;
  onEdit: (product: Product) => void;
  onAction: (action: ProductAction) => void;
}

export function ProductsTable({
  products,
  sortBy,
  sortDirection,
  isRefreshing,
  onSort,
  onEdit,
  onAction,
}: ProductsTableProps) {
  const sortProps = { sortBy, sortDirection, onSort };

  return (
    <div aria-busy={isRefreshing} className={cn('transition-opacity duration-200', isRefreshing && 'opacity-60')}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead field="displayName" label="Product" {...sortProps} />
            <SortableHead field="categoryEn" label="Category" {...sortProps} />
            <SortableHead field="listPriceBrl" label="List price" align="right" {...sortProps} />
            <TableHead className="text-right">Weight</TableHead>
            <TableHead>Status</TableHead>
            <SortableHead field="updatedAt" label="Updated" align="right" {...sortProps} />
            <TableHead className="w-10">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.productId} className="group">
              <TableCell className="max-w-[22rem]">
                <Link
                  to={productDetailPath(product.productId)}
                  className={cn(
                    'block truncate hover:underline',
                    product.isActive ? 'text-ink' : 'text-ink-3 line-through decoration-ink-3/60'
                  )}
                >
                  {product.displayName}
                </Link>
                {product.source === 'app' ? <span className="block text-xs text-ink-3">Created in the app</span> : null}
              </TableCell>
              <TableCell className="text-ink-2">{humanizeSlug(product.categoryEn)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.listPriceBrl)}</TableCell>
              <TableCell className="text-right text-ink-2">
                {product.weightG === null ? '—' : `${formatCount(product.weightG)} g`}
              </TableCell>
              <TableCell>
                <ProductStatus isActive={product.isActive} />
              </TableCell>
              <TableCell className="text-right text-ink-2">{formatIsoDate(product.updatedAt.slice(0, 10))}</TableCell>
              <TableCell className="text-right">
                <ProductRowActions product={product} onEdit={onEdit} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
