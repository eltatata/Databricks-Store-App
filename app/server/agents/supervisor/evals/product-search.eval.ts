import { defineEval } from '@databricks/appkit/beta';
import { didNotCallTools, MUTATING_TOOLS } from './assertions';

export default defineEval({
  description: 'Listing products of a category uses the catalog search with the category filter',
  tags: ['routing', 'read'],
  async test(t) {
    await t.send('List a few products in the watches_gifts category');
    t.succeeded();
    t.calledToolWith('search_products', { category: 'watches_gifts' });
    didNotCallTools(t, ['ask_analytics', ...MUTATING_TOOLS]);
  },
});
