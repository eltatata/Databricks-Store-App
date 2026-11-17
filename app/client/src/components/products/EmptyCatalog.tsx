import { toast } from 'sonner';
import { isApiError } from '@/api/http';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { useSeedProducts } from '@/hooks/products/useProductMutations';
import { formatCount } from '@/utils/format';

interface EmptyCatalogProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyCatalog({ hasFilters, onClearFilters }: EmptyCatalogProps) {
  const seed = useSeedProducts();

  if (hasFilters) {
    return (
      <EmptyState
        title="No products match these filters"
        description="Try another search term, category or status."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  const importCatalog = async () => {
    try {
      const result = await seed.mutateAsync();
      toast.success('Catalog imported', { description: `${formatCount(result.insertedProducts)} products added` });
    } catch (error) {
      toast.error('The import failed', { description: isApiError(error) ? error.message : undefined });
    }
  };

  return (
    <EmptyState
      title="The catalog is empty"
      description="Import the Olist products from the serving layer to start managing them, or create one by hand."
      action={
        <Button onClick={() => void importCatalog()} disabled={seed.isPending}>
          {seed.isPending ? 'Importing…' : 'Import Olist products'}
        </Button>
      }
    />
  );
}
