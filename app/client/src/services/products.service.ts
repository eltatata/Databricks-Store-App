import { http } from '@/api/http';
import type { Paginated } from '@/types/api.types';
import type { Product, ProductInput, ProductListParams, ProductUpdate, SeedResult } from '@/types/product.types';

const productPath = (productId: string) => `/products/${encodeURIComponent(productId)}`;

export const productsService = {
  list: async (params: ProductListParams, signal?: AbortSignal): Promise<Paginated<Product>> => {
    const response = await http.get<Product[]>('/products', { query: { ...params }, signal });
    return {
      items: response.data,
      meta: response.meta ?? { page: params.page, pageSize: params.pageSize, total: 0, totalPages: 0 },
    };
  },

  get: async (productId: string, signal?: AbortSignal) =>
    (await http.get<Product>(productPath(productId), { signal })).data,

  listCategories: async (signal?: AbortSignal) => (await http.get<string[]>('/products/categories', { signal })).data,

  create: async (input: ProductInput) => (await http.post<Product>('/products', input)).data,

  update: async (productId: string, changes: ProductUpdate) =>
    (await http.patch<Product>(productPath(productId), changes)).data,

  deactivate: async (productId: string) => (await http.delete<Product>(productPath(productId))).data,

  removePermanently: async (productId: string) => {
    await http.delete<null>(productPath(productId), { query: { permanent: true } });
  },

  seed: async () => (await http.post<SeedResult>('/admin/seed-products', { confirm: true })).data,
};
