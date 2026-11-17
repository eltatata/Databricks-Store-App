import { defineEval } from '@databricks/appkit/beta';
import { didNotCallTools, MUTATING_TOOLS } from './assertions';

export default defineEval({
  description: 'An update by name also searches inactive products before saying the product does not exist',
  tags: ['mutation', 'routing'],
  timeoutMs: 120_000,
  async test(t) {
    await t.send('Change the price of Zebra Quartz Teapot to 50 BRL');
    t.succeeded();
    t.calledToolWith('search_products', { includeInactive: true });
    didNotCallTools(t, MUTATING_TOOLS);
  },
});
