import { defineEval } from '@databricks/appkit/beta';
import { SAMPLE_PRODUCT_ID } from './assertions';

export default defineEval({
  description: 'Deactivating a known product calls deactivate_product behind the approval gate',
  tags: ['mutation', 'approval'],
  timeoutMs: 120_000,
  async test(t) {
    await t.send(`Deactivate product ${SAMPLE_PRODUCT_ID}`);
    t.succeeded();
    t.calledToolWith('deactivate_product', { productId: SAMPLE_PRODUCT_ID });
  },
});
