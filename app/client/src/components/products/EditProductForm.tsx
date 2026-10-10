import { useState } from 'react';
import { toast } from 'sonner';
import { isApiError } from '@/api/http';
import { useReloadProduct, useUpdateProduct } from '@/hooks/products/useProductMutations';
import type { Product } from '@/types/product.types';
import { ConflictNotice } from './ConflictNotice';
import { ProductForm } from './ProductForm';
import { changedFields, formValuesToInput, productToFormValues } from './product-form.schema';

interface EditProductFormProps {
  product: Product;
  onSaved?: (product: Product) => void;
  onCancel?: () => void;
}

export function EditProductForm({ product, onSaved, onCancel }: EditProductFormProps) {
  const updateProduct = useUpdateProduct(product.productId);
  const reloadProduct = useReloadProduct();
  const [hasConflict, setHasConflict] = useState(false);

  const save = async (values: Parameters<typeof formValuesToInput>[0]) => {
    const changes = changedFields(product, formValuesToInput(values));
    try {
      const saved = await updateProduct.mutateAsync({ ...changes, version: product.version });
      toast.success('Product saved', { description: saved.displayName });
      onSaved?.(saved);
    } catch (error) {
      if (isApiError(error) && error.code === 'VERSION_CONFLICT') {
        setHasConflict(true);
        return;
      }
      if (!isApiError(error) || error.code !== 'VALIDATION_ERROR') {
        toast.error('The product was not saved', { description: isApiError(error) ? error.message : undefined });
      }
      throw error;
    }
  };

  const reload = async () => {
    await reloadProduct(product.productId);
    setHasConflict(false);
  };

  return (
    <ProductForm
      key={`${product.productId}-${product.version}`}
      initialValues={productToFormValues(product)}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      onSubmit={save}
      onCancel={onCancel}
      banner={hasConflict ? <ConflictNotice onReload={() => void reload()} /> : null}
    />
  );
}
