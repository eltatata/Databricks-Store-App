import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import type { ProductListParams } from '@/types/product.types';
import { productKeys } from './products.keys';

const CATEGORIES_STALE_TIME_MS = 10 * 60_000;

export const useProducts = (params: ProductListParams) =>
  useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => productsService.list(params, signal),
    placeholderData: keepPreviousData,
  });

export const useProduct = (productId: string | undefined) =>
  useQuery({
    queryKey: productKeys.detail(productId ?? ''),
    queryFn: ({ signal }) => productsService.get(productId ?? '', signal),
    enabled: Boolean(productId),
  });

export const useProductCategories = () =>
  useQuery({
    queryKey: productKeys.categories(),
    queryFn: ({ signal }) => productsService.listCategories(signal),
    staleTime: CATEGORIES_STALE_TIME_MS,
  });
