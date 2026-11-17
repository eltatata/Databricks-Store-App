import { randomUUID } from 'node:crypto';
import { withTransaction } from '../database/client';
import {
  countProducts,
  deleteProduct,
  findProductById,
  findProducts,
  insertProduct,
  listProductCategories,
  updateProductAtVersion,
} from '../database/queries/products.queries';
import type { Paginated } from '../interfaces/api.interface';
import type { ActorContext } from '../interfaces/context.interface';
import type { Product, ProductListFilters } from '../interfaces/product.interface';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from '../schemas/products.schema';
import { notFound, unprocessable, versionConflict } from '../utils/errors';
import { buildPaginationMeta, toOffset } from '../utils/pagination';
import { recordAuditEvent } from './audit.service';

const PRODUCT_ENTITY = 'product';

function toFilters(query: ListProductsQuery): ProductListFilters {
  return {
    search: query.search,
    category: query.category,
    isActive: query.active,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    limit: query.pageSize,
    offset: toOffset(query.page, query.pageSize),
  };
}

export async function listProducts(query: ListProductsQuery): Promise<Paginated<Product>> {
  const filters = toFilters(query);
  const [items, total] = await Promise.all([findProducts(filters), countProducts(filters)]);
  return { items, meta: buildPaginationMeta(query.page, query.pageSize, total) };
}

export async function getProduct(productId: string): Promise<Product> {
  const product = await findProductById(productId);
  if (!product) {
    throw notFound('Product', productId);
  }
  return product;
}

export function listCategories(): Promise<string[]> {
  return listProductCategories();
}

export function createProduct(input: CreateProductInput, actor: ActorContext): Promise<Product> {
  return withTransaction(async (transaction) => {
    const product = await insertProduct({ ...input, productId: randomUUID(), source: 'app' }, transaction);
    await recordAuditEvent(
      { actor, action: 'create', entity: PRODUCT_ENTITY, entityId: product.productId, after: product },
      transaction
    );
    return product;
  });
}

export function updateProduct(productId: string, input: UpdateProductInput, actor: ActorContext): Promise<Product> {
  const { version, ...changes } = input;
  return withTransaction(async (transaction) => {
    const current = await findProductById(productId, transaction);
    if (!current) {
      throw notFound('Product', productId);
    }
    const updated = await updateProductAtVersion(productId, version, changes, transaction);
    if (!updated) {
      throw versionConflict('Product', productId);
    }
    await recordAuditEvent(
      { actor, action: 'update', entity: PRODUCT_ENTITY, entityId: productId, before: current, after: updated },
      transaction
    );
    return updated;
  });
}

export function deactivateProduct(productId: string, actor: ActorContext): Promise<Product> {
  return withTransaction(async (transaction) => {
    const current = await findProductById(productId, transaction);
    if (!current) {
      throw notFound('Product', productId);
    }
    if (!current.isActive) {
      return current;
    }
    const deactivated = await updateProductAtVersion(productId, current.version, { isActive: false }, transaction);
    if (!deactivated) {
      throw versionConflict('Product', productId);
    }
    await recordAuditEvent(
      { actor, action: 'deactivate', entity: PRODUCT_ENTITY, entityId: productId, before: current, after: deactivated },
      transaction
    );
    return deactivated;
  });
}

export function deleteProductPermanently(productId: string, actor: ActorContext): Promise<void> {
  return withTransaction(async (transaction) => {
    const current = await findProductById(productId, transaction);
    if (!current) {
      throw notFound('Product', productId);
    }
    if (current.source !== 'app') {
      throw unprocessable(
        'Only products created in the app can be deleted permanently. Deactivate catalog products instead'
      );
    }
    await deleteProduct(productId, transaction);
    await recordAuditEvent(
      { actor, action: 'delete', entity: PRODUCT_ENTITY, entityId: productId, before: current },
      transaction
    );
  });
}
