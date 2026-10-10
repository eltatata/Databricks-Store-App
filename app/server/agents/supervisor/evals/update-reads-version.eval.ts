import { defineEval } from '@databricks/appkit/beta';
import { SAMPLE_PRODUCT_ID } from './assertions';

export default defineEval({
  description: 'A price change reads the product first and sends its version to update_product',
  tags: ['mutation', 'approval'],
  timeoutMs: 120_000,
  async test(t) {
    await t.send(`Change the price of product ${SAMPLE_PRODUCT_ID} to 189.90 BRL`);
    t.succeeded();
    t.calledTool('get_product');
    t.calledToolWith('update_product', { productId: SAMPLE_PRODUCT_ID, changes: { listPriceBrl: 189.9 } });
  },
});
