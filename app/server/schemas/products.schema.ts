import { z } from 'zod';
import { PRODUCT_SORT_FIELDS, PRODUCT_SOURCES, SORT_DIRECTIONS } from '../config/constants';
import { booleanQuerySchema, paginationMetaSchema, paginationQuerySchema } from './common.schema';

const MAX_DIMENSION = 1_000_000;
const MAX_PRICE_BRL = 1_000_000;

const dimensionSchema = z.number().int().min(0).max(MAX_DIMENSION).nullable();

const editableProductShape = {
  displayName: z.string().trim().min(1).max(200).meta({ description: 'Product display label' }),
  categoryEn: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase snake_case, for example health_beauty')
    .meta({ description: 'Category in English snake_case' }),
  weightG: dimensionSchema.meta({ description: 'Weight in grams' }),
  lengthCm: dimensionSchema.meta({ description: 'Length in centimeters' }),
  heightCm: dimensionSchema.meta({ description: 'Height in centimeters' }),
  widthCm: dimensionSchema.meta({ description: 'Width in centimeters' }),
  listPriceBrl: z.number().min(0).max(MAX_PRICE_BRL).nullable().meta({ description: 'List price in BRL' }),
};

export const productIdParamsSchema = z.object({
  productId: z.string().trim().min(1).max(64).meta({ description: 'Product identifier' }),
});

export const createProductBodySchema = z
  .strictObject({
    displayName: editableProductShape.displayName,
    categoryEn: editableProductShape.categoryEn,
    weightG: editableProductShape.weightG.optional(),
    lengthCm: editableProductShape.lengthCm.optional(),
    heightCm: editableProductShape.heightCm.optional(),
    widthCm: editableProductShape.widthCm.optional(),
    listPriceBrl: editableProductShape.listPriceBrl.optional(),
  })
  .meta({ id: 'CreateProductRequest' });

export const updateProductBodySchema = z
  .strictObject({
    displayName: editableProductShape.displayName.optional(),
    categoryEn: editableProductShape.categoryEn.optional(),
    weightG: editableProductShape.weightG.optional(),
    lengthCm: editableProductShape.lengthCm.optional(),
    heightCm: editableProductShape.heightCm.optional(),
    widthCm: editableProductShape.widthCm.optional(),
    listPriceBrl: editableProductShape.listPriceBrl.optional(),
    isActive: z.boolean().optional().meta({ description: 'Reactivate or deactivate the product' }),
    version: z
      .number()
      .int()
      .min(1)
      .meta({ description: 'Version read by the client, used for optimistic concurrency' }),
  })
  .refine((body) => Object.keys(body).some((key) => key !== 'version'), {
    message: 'Provide at least one field to change',
  })
  .meta({ id: 'UpdateProductRequest' });

export const listProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional().meta({ description: 'Search by display name or product id' }),
  category: z.string().trim().min(1).max(100).optional().meta({ description: 'Exact category filter' }),
  active: booleanQuerySchema.optional().meta({ description: 'Filter by active status' }),
  sortBy: z.enum(PRODUCT_SORT_FIELDS).default('displayName'),
  sortDirection: z.enum(SORT_DIRECTIONS).default('asc'),
});

export const deleteProductQuerySchema = z.object({
  permanent: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true')
    .meta({ description: 'Hard delete. Only allowed for products created in the app' }),
});

export const productSchema = z
  .object({
    productId: z.string(),
    displayName: z.string(),
    categoryEn: z.string(),
    weightG: z.number().int().nullable(),
    lengthCm: z.number().int().nullable(),
    heightCm: z.number().int().nullable(),
    widthCm: z.number().int().nullable(),
    listPriceBrl: z.number().nullable(),
    isActive: z.boolean(),
    source: z.enum(PRODUCT_SOURCES),
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number().int(),
  })
  .meta({ id: 'Product' });

export const productResponseSchema = z.object({ data: productSchema }).meta({ id: 'ProductResponse' });

export const productListResponseSchema = z
  .object({ data: z.array(productSchema), meta: paginationMetaSchema })
  .meta({ id: 'ProductListResponse' });

export const categoryListResponseSchema = z.object({ data: z.array(z.string()) }).meta({ id: 'CategoryListResponse' });

export const seedProductsBodySchema = z
  .strictObject({ confirm: z.literal(true).meta({ description: 'Must be true to run the seed' }) })
  .meta({ id: 'SeedProductsRequest' });

export const seedProductsResponseSchema = z
  .object({ data: z.object({ insertedProducts: z.number().int() }) })
  .meta({ id: 'SeedProductsResponse' });

export type CreateProductInput = z.infer<typeof createProductBodySchema>;
export type UpdateProductInput = z.infer<typeof updateProductBodySchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type DeleteProductQuery = z.infer<typeof deleteProductQuerySchema>;
