import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/common/useDebouncedValue';
import type { ProductListState } from '@/hooks/products/useProductListParams';
import { useProductCategories } from '@/hooks/products/useProductQueries';
import type { ProductStatusFilter } from '@/types/product.types';
import { humanizeSlug } from '@/utils/format';

const ALL_CATEGORIES = '__all__';
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'active' as const, label: 'Active' },
  { value: 'inactive' as const, label: 'Inactive' },
];

interface ProductsToolbarProps {
  state: ProductListState;
  onChange: (changes: Partial<ProductListState>) => void;
}

export function ProductsToolbar({ state, onChange }: ProductsToolbarProps) {
  const categories = useProductCategories();
  const [search, setSearch] = useState(state.search);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedSearch !== state.search) {
      onChange({ search: debouncedSearch });
    }
  }, [debouncedSearch, state.search, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-sm">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          strokeWidth={1.75}
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or product ID"
          aria-label="Search products"
          className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-ink-3 hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <Select
        value={state.category ?? ALL_CATEGORIES}
        onValueChange={(value) => onChange({ category: value === ALL_CATEGORIES ? null : value })}
      >
        <SelectTrigger aria-label="Filter by category" className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
          {(categories.data ?? []).map((name) => (
            <SelectItem key={name} value={name}>
              {humanizeSlug(name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <SegmentedControl<ProductStatusFilter>
        label="Status"
        options={STATUS_OPTIONS}
        value={state.status}
        onChange={(status) => onChange({ status })}
        accentId="product-status-signal"
      />
    </div>
  );
}
