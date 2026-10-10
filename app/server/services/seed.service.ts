import { withTransaction } from '../database/client';
import { seedProductsFromServingCatalog } from '../database/queries/products.queries';
import type { ActorContext } from '../interfaces/context.interface';
import type { SeedResult } from '../interfaces/product.interface';
import { recordAuditEvent } from './audit.service';

export function seedProductsFromCatalog(actor: ActorContext): Promise<SeedResult> {
  return withTransaction(async (transaction) => {
    const insertedProducts = await seedProductsFromServingCatalog(transaction);
    await recordAuditEvent(
      {
        actor,
        action: 'seed',
        entity: 'product_catalog',
        entityId: 'serving.dim_product',
        after: { insertedProducts },
      },
      transaction
    );
    return { insertedProducts };
  });
}
