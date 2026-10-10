import { defineEval, includes } from '@databricks/appkit/beta';
import { SAMPLE_PRODUCT_ID } from './assertions';

export default defineEval({
  description: 'A product id lookup reads that product from Lakebase',
  tags: ['routing', 'read'],
  async test(t) {
    await t.send(`What is the current price of product ${SAMPLE_PRODUCT_ID}?`);
    t.succeeded();
    t.calledToolWith('get_product', { productId: SAMPLE_PRODUCT_ID });
    t.check(t.reply, includes('199'));
  },
});
