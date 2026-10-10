import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import type { Product, ProductInput, ProductUpdate } from '@/types/product.types';
import { productKeys } from './products.keys';

const useProductCacheSync = () => {
  const queryClient = useQueryClient();
  return {
    storeProduct: (product: Product) => {
      queryClient.setQueryData(productKeys.detail(product.productId), product);
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    forgetProduct: (productId: string) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    refreshCategories: () => queryClient.invalidateQueries({ queryKey: productKeys.categories() }),
    refreshProduct: (productId: string) => queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) }),
  };
};

export const useCreateProduct = () => {
  const cache = useProductCacheSync();
  return useMutation({
    mutationFn: (input: ProductInput) => productsService.create(input),
    onSuccess: async (product) => {
      await Promise.all([cache.storeProduct(product), cache.refreshCategories()]);
    },
  });
};

export const useUpdateProduct = (productId: string) => {
  const cache = useProductCacheSync();
  return useMutation({
    mutationFn: (changes: ProductUpdate) => productsService.update(productId, changes),
    onSuccess: async (product) => {
      await Promise.all([cache.storeProduct(product), cache.refreshCategories()]);
    },
  });
};

export const useDeactivateProduct = () => {
  const cache = useProductCacheSync();
  return useMutation({
    mutationFn: (productId: string) => productsService.deactivate(productId),
    onSuccess: (product) => cache.storeProduct(product),
  });
};

export const useReactivateProduct = () => {
  const cache = useProductCacheSync();
  return useMutation({
    mutationFn: (product: Pick<Product, 'productId' | 'version'>) =>
      productsService.update(product.productId, { isActive: true, version: product.version }),
    onSuccess: (product) => cache.storeProduct(product),
  });
};

export const useDeleteProductPermanently = () => {
  const cache = useProductCacheSync();
  return useMutation({
    mutationFn: async (productId: string) => {
      await productsService.removePermanently(productId);
      return productId;
    },
    onSuccess: (productId) => cache.forgetProduct(productId),
  });
};

export const useReloadProduct = () => {
  const cache = useProductCacheSync();
  return (productId: string) => cache.refreshProduct(productId);
};
