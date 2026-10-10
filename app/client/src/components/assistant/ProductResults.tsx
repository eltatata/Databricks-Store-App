import { Link } from 'react-router';
import { ProductStatus } from '@/components/products/ProductStatus';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { productDetailPath } from '@/configs/routes';
import { cn } from '@/lib/utils';
import type { AgentProduct } from '@/utils/agent-tool-results';
import { formatCount, formatCurrency, humanizeSlug } from '@/utils/format';

function ProductName({ product }: { product: AgentProduct }) {
  return (
    <Link
      to={productDetailPath(product.productId)}
      className={cn(
        'underline-offset-4 hover:underline',
        product.isActive ? 'text-ink' : 'text-ink-3 line-through decoration-ink-3'
      )}
    >
      {product.displayName}
    </Link>
  );
}

interface ProductResultTableProps {
  products: AgentProduct[];
  total: number;
}

export function ProductResultTable({ products, total }: ProductResultTableProps) {
  if (products.length === 0) {
    return <p className="border-t border-hairline pt-4 text-sm text-ink-3">No products matched.</p>;
  }
  return (
    <figure className="flex flex-col gap-2 border-t border-hairline pt-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">List price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.productId}>
                <TableCell className="max-w-[18rem] truncate">
                  <ProductName product={product} />
                </TableCell>
                <TableCell className="text-ink-2">{humanizeSlug(product.categoryEn)}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.listPriceBrl)}</TableCell>
                <TableCell>
                  <ProductStatus isActive={product.isActive} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <figcaption className="text-xs text-ink-3">
        {products.length < total
          ? `Showing ${formatCount(products.length)} of ${formatCount(total)} matches`
          : `${formatCount(total)} ${total === 1 ? 'match' : 'matches'}`}
      </figcaption>
    </figure>
  );
}

export function ProductResultLine({ product }: { product: AgentProduct }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-hairline pt-4 text-sm">
      <ProductName product={product} />
      <span className="text-ink-2">{humanizeSlug(product.categoryEn)}</span>
      <span className="text-ink-2 tabular-nums">{formatCurrency(product.listPriceBrl)}</span>
      <ProductStatus isActive={product.isActive} />
      <span className="text-xs text-ink-3 tabular-nums">Version {product.version}</span>
    </div>
  );
}
