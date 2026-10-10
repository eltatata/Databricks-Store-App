import * as productsController from '../controllers/products.controller';
import type { RouteDefinition } from '../interfaces/route.interface';
import { errorResponseSchema } from '../schemas/common.schema';
import {
  categoryListResponseSchema,
  createProductBodySchema,
  deleteProductQuerySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  productListResponseSchema,
  productResponseSchema,
  updateProductBodySchema,
} from '../schemas/products.schema';

const TAG = 'Products';
const notFoundResponse = { description: 'Product not found', schema: errorResponseSchema };

export const productRoutes: RouteDefinition[] = [
  {
    method: 'get',
    path: '/products',
    summary: 'List products with search, filters, sorting and pagination',
    tag: TAG,
    request: { query: listProductsQuerySchema },
    responses: { 200: { description: 'Product page', schema: productListResponseSchema } },
    handler: productsController.listProducts,
  },
  {
    method: 'get',
    path: '/products/categories',
    summary: 'List the categories used by products',
    tag: TAG,
    responses: { 200: { description: 'Categories', schema: categoryListResponseSchema } },
    handler: productsController.listCategories,
  },
  {
    method: 'post',
    path: '/products',
    summary: 'Create a product',
    tag: TAG,
    request: { body: createProductBodySchema },
    responses: {
      201: { description: 'Product created', schema: productResponseSchema },
      422: { description: 'Violates a database rule', schema: errorResponseSchema },
    },
    handler: productsController.createProduct,
  },
  {
    method: 'get',
    path: '/products/:productId',
    summary: 'Get a product',
    tag: TAG,
    request: { params: productIdParamsSchema },
    responses: { 200: { description: 'Product', schema: productResponseSchema }, 404: notFoundResponse },
    handler: productsController.getProduct,
  },
  {
    method: 'patch',
    path: '/products/:productId',
    summary: 'Update a product with optimistic concurrency',
    tag: TAG,
    request: { params: productIdParamsSchema, body: updateProductBodySchema },
    responses: {
      200: { description: 'Product updated', schema: productResponseSchema },
      404: notFoundResponse,
      409: { description: 'Version conflict', schema: errorResponseSchema },
    },
    handler: productsController.updateProduct,
  },
  {
    method: 'delete',
    path: '/products/:productId',
    summary: 'Deactivate a product, or delete it permanently with permanent=true',
    tag: TAG,
    request: { params: productIdParamsSchema, query: deleteProductQuerySchema },
    responses: {
      200: { description: 'Product deactivated', schema: productResponseSchema },
      204: { description: 'Product deleted permanently' },
      404: notFoundResponse,
      422: { description: 'Permanent delete not allowed', schema: errorResponseSchema },
    },
    handler: productsController.deleteProduct,
  },
];
