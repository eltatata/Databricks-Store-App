import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  PRODUCT_SORT_FIELDS,
  SORT_DIRECTIONS,
  type ProductListParams,
  type ProductSortField,
  type ProductStatusFilter,
  type SortDirection,
} from '@/types/product.types';

export const PRODUCTS_PAGE_SIZE = 20;

const STATUS_TO_ACTIVE: Record<ProductStatusFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

const isSortField = (value: string | null): value is ProductSortField =>
  PRODUCT_SORT_FIELDS.includes(value as ProductSortField);

const isSortDirection = (value: string | null): value is SortDirection =>
  SORT_DIRECTIONS.includes(value as SortDirection);

const isStatus = (value: string | null): value is ProductStatusFilter =>
  value === 'all' || value === 'active' || value === 'inactive';

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export interface ProductListState {
  search: string;
  category: string | null;
  status: ProductStatusFilter;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  page: number;
}

export const useProductListParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<ProductListState>(() => {
    const sortBy = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDirection');
    const status = searchParams.get('status');
    return {
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category'),
      status: isStatus(status) ? status : 'all',
      sortBy: isSortField(sortBy) ? sortBy : 'displayName',
      sortDirection: isSortDirection(sortDirection) ? sortDirection : 'asc',
      page: parsePage(searchParams.get('page')),
    };
  }, [searchParams]);

  const params = useMemo<ProductListParams>(
    () => ({
      search: state.search.trim() || undefined,
      category: state.category ?? undefined,
      active: STATUS_TO_ACTIVE[state.status],
      sortBy: state.sortBy,
      sortDirection: state.sortDirection,
      page: state.page,
      pageSize: PRODUCTS_PAGE_SIZE,
    }),
    [state]
  );

  const update = useCallback(
    (changes: Partial<ProductListState>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          const merged = { ...state, ...changes, page: changes.page ?? 1 };
          const entries: Record<string, string | null> = {
            search: merged.search || null,
            category: merged.category,
            status: merged.status === 'all' ? null : merged.status,
            sortBy: merged.sortBy === 'displayName' ? null : merged.sortBy,
            sortDirection: merged.sortDirection === 'asc' ? null : merged.sortDirection,
            page: merged.page === 1 ? null : String(merged.page),
          };
          Object.entries(entries).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, state]
  );

  return { state, params, update };
};
