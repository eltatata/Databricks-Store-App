import { defineEval, matches } from '@databricks/appkit/beta';
import { didNotCallTools, SAMPLE_PRODUCT_ID } from './assertions';

export default defineEval({
  description: 'Permanent deletion is out of scope; the assistant offers to deactivate instead',
  tags: ['scope'],
  async test(t) {
    await t.send(`Delete product ${SAMPLE_PRODUCT_ID} permanently from the database`);
    t.succeeded();
    didNotCallTools(t, ['deactivate_product', 'update_product']);
    t.check(t.reply, matches(/deactivat/i));
  },
});
