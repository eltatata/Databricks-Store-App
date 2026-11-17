import { z } from 'zod';

const AGENT_SEARCH_LIMIT = 20;
const AGENT_SEARCH_DEFAULT = 10;

const isoDateArgument = z.string().describe('Date as YYYY-MM-DD');
const productIdArgument = z.string().min(1).max(64).describe('Exact product id');
const categoryArgument = z
  .string()
  .min(1)
  .max(100)
  .describe('Category in lowercase snake_case, for example health_beauty');
const dimensionArgument = z.number().int().min(0).nullable();

const productFieldArguments = {
  displayName: z.string().min(1).max(200).describe('Product display name'),
  categoryEn: categoryArgument,
  listPriceBrl: z.number().min(0).nullable().describe('List price in BRL'),
  weightG: dimensionArgument.describe('Weight in grams'),
  lengthCm: dimensionArgument.describe('Length in centimeters'),
  heightCm: dimensionArgument.describe('Height in centimeters'),
  widthCm: dimensionArgument.describe('Width in centimeters'),
};

export const kpiSummaryToolSchema = z.object({
  from: isoDateArgument.optional().describe('Inclusive start purchase date as YYYY-MM-DD'),
  to: isoDateArgument.optional().describe('Inclusive end purchase date as YYYY-MM-DD'),
});

const STATE_MAP_METRICS = ['gmv', 'orders', 'averageOrderValue', 'freight'] as const;

export const salesByStateToolSchema = kpiSummaryToolSchema.extend({
  metric: z
    .enum(STATE_MAP_METRICS)
    .optional()
    .describe('The measure the user asked about; the map opens on it. Default gmv'),
});

export const searchProductsToolSchema = z.object({
  query: z.string().min(1).max(100).optional().describe('Words from the product name, or a product id'),
  category: categoryArgument.optional(),
  includeInactive: z.boolean().optional().describe('Also return deactivated products'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(AGENT_SEARCH_LIMIT)
    .optional()
    .describe(`Maximum results, default ${AGENT_SEARCH_DEFAULT}`),
});

export const getProductToolSchema = z.object({ productId: productIdArgument });

export const createProductToolSchema = z.object({
  displayName: productFieldArguments.displayName,
  categoryEn: productFieldArguments.categoryEn,
  listPriceBrl: productFieldArguments.listPriceBrl.optional(),
  weightG: productFieldArguments.weightG.optional(),
  lengthCm: productFieldArguments.lengthCm.optional(),
  heightCm: productFieldArguments.heightCm.optional(),
  widthCm: productFieldArguments.widthCm.optional(),
});

export const updateProductToolSchema = z.object({
  productId: productIdArgument,
  version: z.number().int().min(1).describe('Current version from get_product'),
  changes: createProductToolSchema
    .partial()
    .extend({
      isActive: z
        .boolean()
        .optional()
        .describe('Only when the user explicitly asks to activate (true) or deactivate (false)'),
    })
    .describe('Only the fields to change'),
});

export const deactivateProductToolSchema = z.object({ productId: productIdArgument });

export const DEFAULT_AGENT_SEARCH_LIMIT = AGENT_SEARCH_DEFAULT;
