import type { Response } from 'express';
import type { ActorContext } from '../interfaces/context.interface';
import { readRequestContext } from '../middlewares/request-context.middleware';
import { readValidated } from '../middlewares/validate.middleware';
import type {
  CreateProductInput,
  DeleteProductQuery,
  ListProductsQuery,
  ProductIdParams,
  UpdateProductInput,
} from '../schemas/products.schema';
import * as productsService from '../services/products.service';
import { asyncHandler } from '../utils/async-handler';
import { sendCreated, sendNoContent, sendOk } from '../utils/response';

function uiActor(response: Response): ActorContext {
  return { userEmail: readRequestContext(response).userEmail, channel: 'ui' };
}

export const listProducts = asyncHandler(async (_request, response) => {
  const { query } = readValidated<{ query: ListProductsQuery }>(response);
  const page = await productsService.listProducts(query);
  sendOk(response, page.items, page.meta);
});

export const listCategories = asyncHandler(async (_request, response) => {
  sendOk(response, await productsService.listCategories());
});

export const getProduct = asyncHandler(async (_request, response) => {
  const { params } = readValidated<{ params: ProductIdParams }>(response);
  sendOk(response, await productsService.getProduct(params.productId));
});

export const createProduct = asyncHandler(async (_request, response) => {
  const { body } = readValidated<{ body: CreateProductInput }>(response);
  sendCreated(response, await productsService.createProduct(body, uiActor(response)));
});

export const updateProduct = asyncHandler(async (_request, response) => {
  const { params, body } = readValidated<{ params: ProductIdParams; body: UpdateProductInput }>(response);
  sendOk(response, await productsService.updateProduct(params.productId, body, uiActor(response)));
});

export const deleteProduct = asyncHandler(async (_request, response) => {
  const { params, query } = readValidated<{ params: ProductIdParams; query: DeleteProductQuery }>(response);
  if (query.permanent) {
    await productsService.deleteProductPermanently(params.productId, uiActor(response));
    sendNoContent(response);
    return;
  }
  sendOk(response, await productsService.deactivateProduct(params.productId, uiActor(response)));
});
