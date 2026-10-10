import { toast } from 'sonner';
import { isApiError } from '@/api/http';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeactivateProduct, useDeleteProductPermanently } from '@/hooks/products/useProductMutations';
import type { Product } from '@/types/product.types';

export type ProductAction = { kind: 'deactivate'; product: Product } | { kind: 'delete'; product: Product } | null;

interface ProductActionDialogProps {
  action: ProductAction;
  onClose: () => void;
  onDeleted?: () => void;
}

const COPY = {
  deactivate: {
    title: 'Deactivate this product?',
    description: 'It stays in the catalog, marked inactive, and you can reactivate it at any time.',
    confirm: 'Deactivate',
    pending: 'Deactivating…',
    success: 'Product deactivated',
  },
  delete: {
    title: 'Delete this product permanently?',
    description: 'It is removed from the catalog for good. The audit log keeps a record of the deletion.',
    confirm: 'Delete permanently',
    pending: 'Deleting…',
    success: 'Product deleted',
  },
} as const;

export function ProductActionDialog({ action, onClose, onDeleted }: ProductActionDialogProps) {
  const deactivate = useDeactivateProduct();
  const remove = useDeleteProductPermanently();
  const copy = action ? COPY[action.kind] : COPY.deactivate;
  const isPending = deactivate.isPending || remove.isPending;

  const confirm = async () => {
    if (!action) {
      return;
    }
    try {
      if (action.kind === 'deactivate') {
        await deactivate.mutateAsync(action.product.productId);
      } else {
        await remove.mutateAsync(action.product.productId);
        onDeleted?.();
      }
      toast.success(copy.success, { description: action.product.displayName });
      onClose();
    } catch (error) {
      toast.error(`${copy.confirm} failed`, { description: isApiError(error) ? error.message : undefined });
    }
  };

  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => (open || isPending ? undefined : onClose())}>
      <AlertDialogContent className="border-hairline bg-raised">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-light">{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-ink">{action?.product.displayName}</span>. {copy.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep product</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className={action?.kind === 'delete' ? 'bg-signal text-ink hover:bg-signal/90' : undefined}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {isPending ? copy.pending : copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
