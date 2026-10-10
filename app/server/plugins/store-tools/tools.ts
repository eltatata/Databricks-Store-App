import { getCallerContext } from '@databricks/appkit';
import { defineTool, type ToolRegistry } from '@databricks/appkit/beta';
import type { ActorContext } from '../../interfaces/context.interface';
import type { Product } from '../../interfaces/product.interface';
import { ZodError } from 'zod';
import {
  createProductToolSchema,
  DEFAULT_AGENT_SEARCH_LIMIT,
  deactivateProductToolSchema,
  getProductToolSchema,
  kpiSummaryToolSchema,
  searchProductsToolSchema,
  updateProductToolSchema,
} from '../../schemas/agent-tools.schema';
import { dateRangeQuerySchema } from '../../schemas/common.schema';
import { createProductBodySchema, productIdParamsSchema, updateProductBodySchema } from '../../schemas/products.schema';
import * as dashboardService from '../../services/dashboard.service';
import * as productsService from '../../services/products.service';
import { isAppError } from '../../utils/errors';
import { logger, serializeError } from '../../utils/logger';

const UNKNOWN_USER = 'unknown';

export interface StoreToolsOptions {
  devUserEmail?: string;
}

export interface ToolFailure {
  error: { code: string; message: string; details?: unknown };
}

function resolveActor(options: StoreToolsOptions): ActorContext {
  const userEmail = getCallerContext()?.principal.userEmail ?? options.devUserEmail ?? UNKNOWN_USER;
  return { userEmail, channel: 'agent' };
}

function toProductSummary(product: Product) {
  return {
    productId: product.productId,
    displayName: product.displayName,
    categoryEn: product.categoryEn,
    listPriceBrl: product.listPriceBrl,
    weightG: product.weightG,
    lengthCm: product.lengthCm,
    heightCm: product.heightCm,
    widthCm: product.widthCm,
    isActive: product.isActive,
    source: product.source,
    version: product.version,
  };
}

export function toToolFailure(error: unknown, toolName: string): ToolFailure {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    return { error: { code: 'VALIDATION_ERROR', message: 'Some arguments are invalid', details } };
  }
  if (isAppError(error) && error.expose) {
    return { error: { code: error.code, message: error.message, details: error.details } };
  }
  logger.error('Agent tool failed', { toolName, ...serializeError(error) });
  return { error: { code: 'INTERNAL_ERROR', message: 'The operation failed. Try again later' } };
}

async function runSafely<T>(toolName: string, operation: () => Promise<T>): Promise<T | ToolFailure> {
  const startedAt = performance.now();
  try {
    const result = await operation();
    logger.info('Agent tool succeeded', { toolName, durationMs: Math.round(performance.now() - startedAt) });
    return result;
  } catch (error) {
    return toToolFailure(error, toolName);
  }
}

export function buildStoreTools(options: StoreToolsOptions): ToolRegistry {
  return {
    get_kpi_summary: defineTool({
      description:
        'Headline store KPIs for an optional purchase date range (YYYY-MM-DD, inclusive): GMV in BRL, orders, items sold, freight, distinct customers, average order value, average review score and late delivery rate (0 to 1). Omit both dates for all time. Data covers 2016-09 to 2018-10.',
      schema: kpiSummaryToolSchema,
      annotations: { effect: 'read' },
      execute: (range) =>
        runSafely('get_kpi_summary', () => dashboardService.getSummary(dateRangeQuerySchema.parse(range))),
    }),
    search_products: defineTool({
      description:
        'Search the product catalog by name words or product id, optionally filtered by exact category. Returns up to 20 products with id, name, category, price in BRL, dimensions, active flag and version. Use it to resolve which product the user means before reading or changing it.',
      schema: searchProductsToolSchema,
      annotations: { effect: 'read' },
      execute: ({ query, category, includeInactive, limit }) =>
        runSafely('search_products', async () => {
          const page = await productsService.listProducts({
            search: query,
            category,
            active: includeInactive ? undefined : true,
            page: 1,
            pageSize: limit ?? DEFAULT_AGENT_SEARCH_LIMIT,
            sortBy: 'displayName',
            sortDirection: 'asc',
          });
          return { total: page.meta.total, products: page.items.map(toProductSummary) };
        }),
    }),
    get_product: defineTool({
      description:
        'Read one product by its exact product id, including its current version. Call it before update_product so the version is fresh.',
      schema: getProductToolSchema,
      annotations: { effect: 'read' },
      execute: ({ productId }) =>
        runSafely('get_product', async () =>
          toProductSummary(await productsService.getProduct(productIdParamsSchema.parse({ productId }).productId))
        ),
    }),
    create_product: defineTool({
      description:
        'Create a new catalog product. Requires displayName and categoryEn (lowercase snake_case, for example health_beauty). Optional: listPriceBrl, weightG, lengthCm, heightCm, widthCm. The user must approve the call before it runs.',
      schema: createProductToolSchema,
      annotations: { effect: 'write' },
      execute: (input) =>
        runSafely('create_product', async () =>
          toProductSummary(
            await productsService.createProduct(createProductBodySchema.parse(input), resolveActor(options))
          )
        ),
    }),
    update_product: defineTool({
      description:
        'Change fields of an existing product. Requires productId, the version returned by get_product, and the changes to apply. Set changes.isActive to true to reactivate a product. Fails with VERSION_CONFLICT if the product changed since it was read. The user must approve the call before it runs.',
      schema: updateProductToolSchema,
      annotations: { effect: 'update' },
      execute: ({ productId, version, changes }) =>
        runSafely('update_product', async () =>
          toProductSummary(
            await productsService.updateProduct(
              productIdParamsSchema.parse({ productId }).productId,
              updateProductBodySchema.parse({ ...changes, version }),
              resolveActor(options)
            )
          )
        ),
    }),
    deactivate_product: defineTool({
      description:
        'Deactivate a product (soft delete). It stays in the catalog marked inactive and can be reactivated later with update_product. The user must approve the call before it runs.',
      schema: deactivateProductToolSchema,
      annotations: { effect: 'destructive' },
      execute: ({ productId }) =>
        runSafely('deactivate_product', async () =>
          toProductSummary(
            await productsService.deactivateProduct(
              productIdParamsSchema.parse({ productId }).productId,
              resolveActor(options)
            )
          )
        ),
    }),
  };
}
