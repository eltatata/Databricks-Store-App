import { toast } from 'sonner';
import { isApiError } from '@/api/http';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCreateProduct } from '@/hooks/products/useProductMutations';
import { useProduct } from '@/hooks/products/useProductQueries';
import type { Product } from '@/types/product.types';
import { EditProductForm } from './EditProductForm';
import { ProductForm } from './ProductForm';
import { EMPTY_PRODUCT_FORM, formValuesToInput, type ProductFormValues } from './product-form.schema';

export type ProductSheetState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; productId: string };

interface ProductSheetProps {
  state: ProductSheetState;
  onClose: () => void;
}

function CreateProductBody({ onClose }: { onClose: () => void }) {
  const createProduct = useCreateProduct();

  const create = async (values: ProductFormValues) => {
    try {
      const product = await createProduct.mutateAsync(formValuesToInput(values));
      toast.success('Product created', { description: product.displayName });
      onClose();
    } catch (error) {
      if (!isApiError(error) || error.code !== 'VALIDATION_ERROR') {
        toast.error('The product was not created', { description: isApiError(error) ? error.message : undefined });
      }
      throw error;
    }
  };

  return (
    <ProductForm
      initialValues={EMPTY_PRODUCT_FORM}
      submitLabel="Create product"
      pendingLabel="Creating…"
      onSubmit={create}
      onCancel={onClose}
      focusOnOpen
    />
  );
}

function EditProductBody({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data, isPending, error } = useProduct(productId);

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-md bg-raised" aria-busy="true" aria-label="Loading product" />;
  }
  if (error || !data) {
    return <p className="text-sm text-ink-2">This product could not load. It may have been deleted.</p>;
  }
  return <EditProductForm product={data} onSaved={onClose} onCancel={onClose} />;
}

const titleOf = (state: ProductSheetState, product: Product | undefined) =>
  state.mode === 'create' ? 'New product' : (product?.displayName ?? 'Edit product');

export function ProductSheet({ state, onClose }: ProductSheetProps) {
  const product = useProduct(state.mode === 'edit' ? state.productId : undefined).data;

  return (
    <Sheet open={state.mode !== 'closed'} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="w-full overflow-y-auto border-hairline bg-raised sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-lg font-light tracking-[-0.01em]">{titleOf(state, product)}</SheetTitle>
          <SheetDescription className="text-ink-3">
            {state.mode === 'create'
              ? 'Products created here live in the app catalog and can be deleted permanently.'
              : 'Changes are saved to Lakebase and recorded in the audit log.'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-8">
          {state.mode === 'create' ? <CreateProductBody onClose={onClose} /> : null}
          {state.mode === 'edit' ? <EditProductBody productId={state.productId} onClose={onClose} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
