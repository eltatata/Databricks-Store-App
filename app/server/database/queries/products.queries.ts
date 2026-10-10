import { type AnyColumn, type SQL, and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type {
  NewProductRecord,
  ProductChanges,
  ProductListFilters,
  ProductRecord,
  ProductSortField,
} from '../../interfaces/product.interface';
import { buildContainsPattern } from '../../utils/sql';
import { type DatabaseExecutor, getDb, runQuery } from '../client';
import { products } from '../schema';

const SORTABLE_COLUMNS: Record<ProductSortField, AnyColumn> = {
  displayName: products.displayName,
  categoryEn: products.categoryEn,
  listPriceBrl: products.listPriceBrl,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

function buildWhereClause(filters: ProductListFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.search) {
    const pattern = buildContainsPattern(filters.search);
    const searchCondition = or(ilike(products.displayName, pattern), ilike(products.productId, pattern));
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }
  if (filters.category) {
    conditions.push(eq(products.categoryEn, filters.category));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function findProducts(
  filters: ProductListFilters,
  executor: DatabaseExecutor = getDb()
): Promise<ProductRecord[]> {
  const sortColumn = SORTABLE_COLUMNS[filters.sortBy];
  const ordering = filters.sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn);
  return runQuery(() =>
    executor
      .select()
      .from(products)
      .where(buildWhereClause(filters))
      .orderBy(ordering, asc(products.productId))
      .limit(filters.limit)
      .offset(filters.offset)
  );
}

export async function countProducts(
  filters: ProductListFilters,
  executor: DatabaseExecutor = getDb()
): Promise<number> {
  const [row] = await runQuery(() =>
    executor.select({ total: count() }).from(products).where(buildWhereClause(filters))
  );
  return row?.total ?? 0;
}

export async function findProductById(
  productId: string,
  executor: DatabaseExecutor = getDb()
): Promise<ProductRecord | undefined> {
  const [row] = await runQuery(() =>
    executor.select().from(products).where(eq(products.productId, productId)).limit(1)
  );
  return row;
}

export async function insertProduct(
  values: NewProductRecord,
  executor: DatabaseExecutor = getDb()
): Promise<ProductRecord> {
  const [row] = await runQuery(() => executor.insert(products).values(values).returning());
  return row;
}

export async function updateProductAtVersion(
  productId: string,
  expectedVersion: number,
  changes: ProductChanges,
  executor: DatabaseExecutor = getDb()
): Promise<ProductRecord | undefined> {
  const [row] = await runQuery(() =>
    executor
      .update(products)
      .set({ ...changes, version: sql`${products.version} + 1`, updatedAt: sql`now()` })
      .where(and(eq(products.productId, productId), eq(products.version, expectedVersion)))
      .returning()
  );
  return row;
}

export async function deleteProduct(productId: string, executor: DatabaseExecutor = getDb()): Promise<boolean> {
  const rows = await runQuery(() =>
    executor.delete(products).where(eq(products.productId, productId)).returning({ productId: products.productId })
  );
  return rows.length > 0;
}

export async function listProductCategories(executor: DatabaseExecutor = getDb()): Promise<string[]> {
  const rows = await runQuery(() =>
    executor.selectDistinct({ categoryEn: products.categoryEn }).from(products).orderBy(asc(products.categoryEn))
  );
  return rows.map((row) => row.categoryEn);
}

export async function seedProductsFromServingCatalog(executor: DatabaseExecutor = getDb()): Promise<number> {
  const result = await runQuery(() =>
    executor.execute(sql`
      INSERT INTO app.products (product_id, display_name, category_en, weight_g, length_cm, height_cm, width_cm, list_price_brl, source)
      SELECT product_id, display_name, category_en, weight_g, length_cm, height_cm, width_cm, median_price_brl, 'olist_seed'
      FROM serving.dim_product
      ON CONFLICT (product_id) DO NOTHING
    `)
  );
  return result.rowCount ?? 0;
}
