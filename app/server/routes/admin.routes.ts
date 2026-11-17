import { seedProducts } from '../controllers/admin.controller';
import type { RouteDefinition } from '../interfaces/route.interface';
import { seedProductsBodySchema, seedProductsResponseSchema } from '../schemas/products.schema';

export const adminRoutes: RouteDefinition[] = [
  {
    method: 'post',
    path: '/admin/seed-products',
    summary: 'Seed app.products from the synced product catalog (idempotent)',
    tag: 'Admin',
    request: { body: seedProductsBodySchema },
    responses: { 200: { description: 'Seed result', schema: seedProductsResponseSchema } },
    handler: seedProducts,
  },
];
