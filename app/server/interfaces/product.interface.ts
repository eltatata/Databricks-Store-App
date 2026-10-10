import type { products } from '../database/schema';
import type { PRODUCT_SORT_FIELDS, SORT_DIRECTIONS } from '../config/constants';

export type ProductRecord = typeof products.$inferSelect;
export type NewProductRecord = typeof products.$inferInsert;
export type Product = ProductRecord;

export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface ProductListFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  limit: number;
  offset: number;
}

export type ProductChanges = Partial<
  Pick<
    NewProductRecord,
    'displayName' | 'categoryEn' | 'weightG' | 'lengthCm' | 'heightCm' | 'widthCm' | 'listPriceBrl' | 'isActive'
  >
>;

export interface SeedResult {
  insertedProducts: number;
}
