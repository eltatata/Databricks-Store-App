import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { isApiError } from '@/api/http';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { productDetailPath } from '@/configs/routes';
import { useReactivateProduct } from '@/hooks/products/useProductMutations';
import type { Product } from '@/types/product.types';
import type { ProductAction } from './ProductActionDialog';

interface ProductRowActionsProps {
  product: Product;
  onEdit: (product: Product) => void;
  onAction: (action: ProductAction) => void;
}

export function ProductRowActions({ product, onEdit, onAction }: ProductRowActionsProps) {
  const navigate = useNavigate();
  const reactivate = useReactivateProduct();

  const runReactivate = async () => {
    try {
      await reactivate.mutateAsync(product);
      toast.success('Product reactivated', { description: product.displayName });
    } catch (error) {
      toast.error('Reactivate failed', { description: isApiError(error) ? error.message : undefined });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-ink-3 hover:text-ink"
          aria-label={`Actions for ${product.displayName}`}
        >
          <MoreHorizontal strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onEdit(product)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void navigate(productDetailPath(product.productId))}>
          Open details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {product.isActive ? (
          <DropdownMenuItem onSelect={() => onAction({ kind: 'deactivate', product })}>Deactivate</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => void runReactivate()}>Reactivate</DropdownMenuItem>
        )}
        {product.source === 'app' ? (
          <DropdownMenuItem variant="destructive" onSelect={() => onAction({ kind: 'delete', product })}>
            Delete permanently
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
