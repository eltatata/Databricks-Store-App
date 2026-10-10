export const PRODUCT_SORT_FIELDS = ['displayName', 'categoryEn', 'listPriceBrl', 'createdAt', 'updatedAt'] as const;
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
export type ProductSource = 'olist_seed' | 'app';
export type ProductStatusFilter = 'all' | 'active' | 'inactive';

export interface Product {
  productId: string;
  displayName: string;
  categoryEn: string;
  weightG: number | null;
  lengthCm: number | null;
  heightCm: number | null;
  widthCm: number | null;
  listPriceBrl: number | null;
  isActive: boolean;
  source: ProductSource;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProductListParams {
  search?: string;
  category?: string;
  active?: boolean;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export interface ProductInput {
  displayName: string;
  categoryEn: string;
  weightG: number | null;
  lengthCm: number | null;
  heightCm: number | null;
  widthCm: number | null;
  listPriceBrl: number | null;
}

export interface ProductUpdate extends Partial<ProductInput> {
  isActive?: boolean;
  version: number;
}

export interface SeedResult {
  insertedProducts: number;
}
